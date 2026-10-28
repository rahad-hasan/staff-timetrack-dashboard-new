"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportCategory, TicketRequesterDetail } from "@/types/support";
import { SUPPORT_LIMITS } from "@/zod/supportSchema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { SupportAlert, SupportButton, useSupportUploads } from "@/components/Support/primitives";
import { AttachmentUploader } from "./AttachmentUploader";
import { CategoryPicker } from "./CategoryPicker";
import { PriorityPicker } from "./PriorityPicker";
import {
  CATEGORY_GONE_MESSAGE,
  createTicketFormSchema,
  useCreateTicketSubmission,
  type CreateTicketDraft,
  type CreateTicketFormValues,
} from "./useCreateTicketSubmission";

export type { CreateTicketDraft } from "./useCreateTicketSubmission";

export interface CreateTicketFormProps {
  categories: SupportCategory[];
  categoriesFailed?: boolean;
  onRetryCategories?: () => Promise<unknown> | void;
  /** prefill (reopen-as-new or a restored draft) */
  initialValues?: Partial<CreateTicketDraft>;
  /** `POST /tickets/:id/reopen-as-new` origin: sent as `reopened_from_id` */
  reopenedFrom?: { id: number; displayNumber?: string | null } | null;
  onCreated: (ticket: TicketRequesterDetail) => void;
  onCancel?: () => void;
  /** a request is in flight (the dialog blocks Escape / outside clicks meanwhile) */
  onBusyChange?: (busy: boolean) => void;
  /** CATEGORY_HIDDEN: the page re-reads the visible categories */
  onCategoryHidden?: () => void;
  /**
   * The server holds this ticket but the form has no readable answer for it:
   * a 2xx failed the narrower, or an IDEMPOTENCY_KEY_REUSED was CONFIRMED by
   * finding the ticket in the list (a REUSED alone proves nothing: the server
   * compares the body hash before it checks whether the first execution is
   * still running or later failed). The caller closes the form, refreshes the
   * list and says so. Without it the form shows an info banner instead.
   */
  onDuplicateDetected?: () => void;
  /** the unsent draft changed (every edit; null once the ticket exists) — the caller keeps it for the next open */
  onDraftChange?: (draft: CreateTicketDraft | null) => void;
  /** "dialog" = inside SupportDialog; "page" = /support/tickets/new */
  variant?: "dialog" | "page";
  /**
   * The field focused when the form mounts (the full page; the dialog's focus is SupportDialog's).
   * Only when nothing else holds focus — a click made before hydration is never overridden.
   */
  autoFocusField?: "title" | "description";
  className?: string;
}

/** "Nothing picked" (the schema's `.positive("Choose a category")` refuses it with that message). */
const NO_CATEGORY = 0;

const TITLE_COUNTER_FROM = 160;
const DESCRIPTION_COUNTER_FROM = 9_000;

/** is_default → the catch-all "general_inquiry" (§4.3) → the last (catch-alls sort last) → the first. */
export const defaultCategoryId = (categories: SupportCategory[]): number | undefined =>
  (
    categories.find((category) => category.is_default) ??
    categories.find((category) => category.slug === "general_inquiry") ??
    categories[categories.length - 1] ??
    categories[0]
  )?.id;

const inputClass = (invalid: boolean) =>
  cn(
    "w-full min-w-0 rounded-lg border bg-white px-3 text-[16px] leading-[22px] text-headingTextColor outline-none transition-[border-color,box-shadow] duration-150 sm:text-[14px]",
    "placeholder:text-support-muted-text focus:border-primary focus:ring-[3px] focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60",
    "dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary",
    invalid ? "border-[#e7000b] focus:border-[#e7000b] focus:ring-[#e7000b]/15" : "border-borderColor hover:border-support-border-hover",
  );

const FieldLabel = ({ htmlFor, id, children, optional = false }: { htmlFor?: string; id?: string; children: string; optional?: boolean }) => {
  const Tag = htmlFor ? "label" : "span";
  return (
    <Tag
      id={id}
      htmlFor={htmlFor}
      className="text-[14px] font-medium leading-5 text-headingTextColor dark:text-darkTextPrimary"
    >
      {children}
      {optional ? (
        <span className="font-normal text-support-muted-text dark:text-darkTextSecondary"> (optional)</span>
      ) : null}
    </Tag>
  );
};

const Counter = ({ length, max, from }: { length: number; max: number; from: number }) =>
  length >= from ? (
    <span
      className={cn(
        "text-[12px] leading-5 tabular-nums",
        length >= max ? "font-medium text-[#c10007]" : "text-support-muted-text",
      )}
    >
      {length.toLocaleString("en-US")}/{max.toLocaleString("en-US")}
    </span>
  ) : null;

/**
 * The create-ticket form (REQ-U-18; not drawn — built from the support
 * tokens and the house form pattern): title (3–200), category (visible
 * categories, icon + colour), priority (D1), description (10–10 000) and up
 * to 10 attachments of 10 MB, validated with the same zod schema as the
 * API's limits. The submission protocol (idempotency, the unknown-outcome
 * lock, the REUSED confirmation) is `useCreateTicketSubmission`; this
 * component lays out the fields.
 */
export const CreateTicketForm = ({
  categories,
  categoriesFailed = false,
  onRetryCategories,
  initialValues,
  reopenedFrom,
  onCreated,
  onCancel,
  onBusyChange,
  onCategoryHidden,
  onDuplicateDetected,
  onDraftChange,
  variant = "dialog",
  autoFocusField,
  className,
}: CreateTicketFormProps) => {
  const formId = useId();
  const ids = {
    title: `${formId}-title`,
    category: `${formId}-category`,
    priorityLabel: `${formId}-priority-label`,
    description: `${formId}-description`,
    attachmentsLabel: `${formId}-attachments-label`,
  };
  const formRef = useRef<HTMLFormElement>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const uploads = useSupportUploads();
  const [retryingCategories, setRetryingCategories] = useState(false);

  const fallbackCategory = useMemo(() => defaultCategoryId(categories), [categories]);
  // A prefilled category that is no longer visible is caught by the effect below (the user re-picks).
  const initialCategory = initialValues?.category_id ?? fallbackCategory ?? NO_CATEGORY;
  /** false once a picked category vanished: the default is never slipped in behind the user's back. */
  const autoPickRef = useRef(true);

  const form = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketFormSchema),
    // Errors appear on submit, then follow every change. NOT on blur: a blur error under a field
    // pushes the submit button down between mousedown and mouseup (the focused field blurs on
    // mousedown), so the first press on "Create ticket" in a scrolling sheet (phones) never clicked.
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      title: (initialValues?.title ?? "").slice(0, SUPPORT_LIMITS.TITLE_MAX),
      description: initialValues?.description ?? "",
      category_id: initialCategory,
      priority: initialValues?.priority ?? "medium",
    },
  });

  const { submitting, pendingAttempt, banner, onSubmit } = useCreateTicketSubmission({
    form,
    formRef,
    uploads,
    initialValues,
    reopenedFrom,
    onCreated,
    onBusyChange,
    onCategoryHidden,
    onDuplicateDetected,
    onDraftChange,
  });

  // Mount only: the page's first field to fill (a reopen-as-new prefill leaves the Description).
  const autoFocusRef = useRef(autoFocusField);
  useEffect(() => {
    const field = autoFocusRef.current;
    if (!field) return;
    const active = document.activeElement;
    if (!active || active === document.body) form.setFocus(field);
  }, [form]);

  const title = useWatch({ control: form.control, name: "title" }) ?? "";
  const description = useWatch({ control: form.control, name: "description" }) ?? "";
  const categoryId = useWatch({ control: form.control, name: "category_id" });

  // Categories arrive (first load / retry): nothing picked yet → the default.
  // The picked one disappeared (hidden or deleted server-side, CATEGORY_HIDDEN on submit):
  // clear it and say so — the user chooses again, nothing is swapped in silently.
  useEffect(() => {
    if (categories.length === 0) return;
    if (!categoryId) {
      if (!autoPickRef.current) return;
      const next = defaultCategoryId(categories);
      if (next !== undefined) form.setValue("category_id", next, { shouldValidate: form.formState.isSubmitted });
      return;
    }
    if (!categories.some((category) => category.id === categoryId)) {
      autoPickRef.current = false;
      // NO_CATEGORY, not undefined: RHF shows a field's DEFAULT value for undefined, so the
      // picker would keep drawing the old default while the form held nothing.
      form.setValue("category_id", NO_CATEGORY);
      form.setError("category_id", { type: "server", message: CATEGORY_GONE_MESSAGE });
    }
  }, [categories, categoryId, form]);

  const retryCategories = async () => {
    if (!onRetryCategories) return;
    setRetryingCategories(true);
    try {
      await onRetryCategories();
    } finally {
      if (mountedRef.current) setRetryingCategories(false);
    }
  };

  const busyUploading = uploads.uploading;
  // fields lock while a request runs AND while an unknown-outcome attempt is kept (its body is frozen)
  const locked = submitting || pendingAttempt;

  return (
    <Form {...form}>
      <form
        id={formId}
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        aria-busy={submitting || undefined}
        data-support-create-form
        className={cn("@container/form flex flex-col gap-5", className)}
      >
        {reopenedFrom ? (
          <SupportAlert tone="info" icon={<Info />}>
            Following up on{" "}
            <span className="font-medium">{reopenedFrom.displayNumber || `ticket #${reopenedFrom.id}`}</span>. The new
            ticket will be linked to it.
          </SupportAlert>
        ) : null}

        <FormField
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <FormItem className="gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <FieldLabel htmlFor={ids.title}>Title</FieldLabel>
                <Counter length={title.length} max={SUPPORT_LIMITS.TITLE_MAX} from={TITLE_COUNTER_FROM} />
              </div>
              <FormControl>
                <input
                  {...field}
                  id={ids.title}
                  type="text"
                  autoComplete="off"
                  maxLength={SUPPORT_LIMITS.TITLE_MAX}
                  placeholder="Short summary of the problem"
                  disabled={locked}
                  aria-required="true"
                  data-support-title
                  className={cn(inputClass(Boolean(fieldState.error)), "h-11")}
                />
              </FormControl>
              <FormMessage className="text-[12.5px] leading-[18px] text-[#c10007]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_id"
          render={({ field, fieldState }) => (
            <FormItem className="gap-1.5">
              <FieldLabel htmlFor={ids.category}>Category</FieldLabel>
              <FormControl>
                <CategoryPicker
                  ref={field.ref}
                  id={ids.category}
                  categories={categories}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  failed={categoriesFailed}
                  retrying={retryingCategories}
                  onRetry={retryCategories}
                  disabled={locked}
                  invalid={Boolean(fieldState.error)}
                />
              </FormControl>
              <FormMessage className="text-[12.5px] leading-[18px] text-[#c10007]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem className="gap-1.5">
              <FieldLabel id={ids.priorityLabel}>Priority</FieldLabel>
              <PriorityPicker
                value={field.value}
                onChange={field.onChange}
                labelId={ids.priorityLabel}
                disabled={locked}
              />
              <FormMessage className="text-[12.5px] leading-[18px] text-[#c10007]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <FormItem className="gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <FieldLabel htmlFor={ids.description}>Description</FieldLabel>
                <Counter
                  length={description.length}
                  max={SUPPORT_LIMITS.DESCRIPTION_MAX}
                  from={DESCRIPTION_COUNTER_FROM}
                />
              </div>
              <FormControl>
                <textarea
                  {...field}
                  id={ids.description}
                  rows={6}
                  maxLength={SUPPORT_LIMITS.DESCRIPTION_MAX}
                  placeholder="What happened, and what did you expect? Steps to reproduce help us fix it faster. You can paste a screenshot here."
                  disabled={locked}
                  aria-required="true"
                  aria-keyshortcuts="Control+Enter Meta+Enter"
                  onKeyDown={(event) => {
                    // Ctrl/⌘ + Enter sends from the description, like the reply composer.
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      formRef.current?.requestSubmit();
                    }
                  }}
                  data-support-description
                  className={cn(inputClass(Boolean(fieldState.error)), "min-h-[148px] resize-y py-2.5")}
                />
              </FormControl>
              <FormMessage className="text-[12.5px] leading-[18px] text-[#c10007]" />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-1.5">
          <FieldLabel id={ids.attachmentsLabel} optional>
            Attachments
          </FieldLabel>
          <AttachmentUploader
            uploads={uploads}
            disabled={locked}
            pasteScopeRef={formRef}
            labelId={ids.attachmentsLabel}
          />
        </div>

        <div aria-live="polite" className="empty:hidden">
          {banner ? (
            <SupportAlert
              data-support-form-banner={banner.tone}
              tone={banner.tone}
              icon={banner.tone === "error" ? <CircleAlert /> : <Info />}
            >
              {banner.message}
            </SupportAlert>
          ) : null}
        </div>

        <div
          className={cn(
            "flex flex-col-reverse gap-2.5 @min-[420px]/form:flex-row @min-[420px]/form:justify-end",
            variant === "page" && "border-t border-support-divider pt-5 dark:border-darkBorder",
          )}
        >
          {onCancel ? (
            <SupportButton variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </SupportButton>
          ) : null}
          <SupportButton
            type="submit"
            icon={<Plus strokeWidth={2} />}
            // loading / blocked = aria-disabled + a click guard, not disabled: the focused button
            // keeps focus while the request runs or the files upload
            loading={submitting}
            blocked={busyUploading}
            data-support-submit
            className="min-w-[132px]"
          >
            {submitting ? "Creating…" : busyUploading ? "Uploading files…" : "Create ticket"}
          </SupportButton>
        </div>
      </form>
    </Form>
  );
};

export default CreateTicketForm;
