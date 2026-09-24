"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { createTicket } from "@/actions/support/action";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAttachmentUploads } from "@/hooks/useAttachmentUploads";
import {
  CATEGORY_LABELS,
  CreateTicketPayload,
  PRIORITY_LABELS,
  TICKET_CATEGORY_VALUES,
  TICKET_PRIORITY_VALUES,
  TicketCategory,
  TicketPriority,
} from "@/types/support";
import {
  CreateTicketFormValues,
  createTicketSchema,
} from "@/zod/supportSchema";
import AttachmentUploader from "./AttachmentUploader";

const DESCRIPTION_WARN_AT = 4500;
const DESCRIPTION_MAX = 5000;

const DEFAULT_VALUES: CreateTicketFormValues = {
  title: "",
  description: "",
  category: "general_inquiry",
  priority: "medium",
  attachments: [],
};

const CreateTicketForm = () => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const uploads = useAttachmentUploads();

  const form = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const descriptionLength = form.watch("description")?.length ?? 0;

  async function onSubmit(values: CreateTicketFormValues) {
    if (uploads.uploading) {
      toast.info("Please wait for your attachments to finish uploading.");
      return;
    }
    if (uploads.hasErrors) {
      toast.error("Retry or remove the attachments that failed to upload.");
      return;
    }

    setSubmitting(true);

    const payload: CreateTicketPayload = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category as TicketCategory,
      priority: values.priority as TicketPriority,
    };

    if (uploads.keys.length > 0) payload.attachments = uploads.keys;

    uploads.setSubmitLock(true);
    const response = await createTicket(payload);

    if (response?.success && response.data) {
      // The objects now belong to the ticket — clear local state without
      // deleting them (unmount cleanup only removes what is still listed).
      uploads.reset();
      toast.success(
        response.message || `Ticket created — ${response.data.display_number}`,
      );
      router.push(`/support/tickets/${response.data.id}`);
      return;
    }

    uploads.setSubmitLock(false);
    setSubmitting(false);
    toast.error(
      response?.message || "We couldn't create your ticket. Please try again.",
    );
  }

  const busy = submitting || uploads.uploading;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <Button
          asChild
          variant="outline2"
          className="w-fit dark:bg-darkPrimaryBg"
        >
          <Link href="/support/tickets">
            <ArrowLeft className="size-4" />
            Back to tickets
          </Link>
        </Button>
        <HeadingComponent
          heading="Create a support ticket"
          subHeading="Give us as much detail as possible so we can help you faster."
        />
      </div>

      <Form {...form}>
        <form
          ref={formRef}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5 rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Short summary of the issue"
                    maxLength={200}
                    autoComplete="off"
                    className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Category</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full dark:bg-darkPrimaryBg">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {TICKET_CATEGORY_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {CATEGORY_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Priority</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full dark:bg-darkPrimaryBg">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {TICKET_PRIORITY_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {PRIORITY_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Description</FormLabel>
                <FormControl>
                  <Textarea
                    rows={7}
                    maxLength={DESCRIPTION_MAX}
                    placeholder="What happened? What did you expect? Include steps to reproduce. You can paste a screenshot directly here."
                    className="min-h-[160px] dark:border-darkBorder dark:bg-darkPrimaryBg"
                    {...field}
                  />
                </FormControl>
                <div className="flex items-center justify-between">
                  <FormMessage />
                  {descriptionLength >= DESCRIPTION_WARN_AT ? (
                    <span
                      className={
                        descriptionLength >= DESCRIPTION_MAX
                          ? "text-xs text-destructive"
                          : "text-xs text-subTextColor dark:text-darkTextSecondary"
                      }
                    >
                      {descriptionLength}/{DESCRIPTION_MAX}
                    </span>
                  ) : null}
                </div>
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label className="dark:text-darkTextPrimary">
              Attachments (optional)
            </Label>
            <AttachmentUploader
              items={uploads.items}
              max={uploads.max}
              onAddFiles={uploads.addFiles}
              onRemove={uploads.remove}
              onRetry={uploads.retry}
              disabled={submitting}
              pasteScopeRef={formRef}
            />
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-borderColor pt-4 sm:flex-row dark:border-darkBorder">
            <Button
              asChild
              type="button"
              variant="outline2"
              className="dark:bg-darkPrimaryBg"
            >
              <Link href="/support/tickets">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={busy || !form.formState.isValid}
            >
              {submitting
                ? "Submitting…"
                : uploads.uploading
                  ? "Uploading attachments…"
                  : "Create ticket"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateTicketForm;
