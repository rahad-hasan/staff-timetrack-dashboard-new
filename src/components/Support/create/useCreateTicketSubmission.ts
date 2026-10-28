"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { SUPPORT_ERROR_CODES, supportApi, supportErrorMessage, waitPhrase, type SupportFail } from "@/lib/support";
import type { CreateTicketPayload, TicketPriority, TicketRequesterDetail } from "@/types/support";
import { newTicketSchema } from "@/zod/supportSchema";
import { useIdempotencyKey, type SupportUploads } from "@/components/Support/primitives";

/** What the form holds (attachments live in the upload queue, not in the form state). */
export const createTicketFormSchema = newTicketSchema.pick({
  title: true,
  description: true,
  category_id: true,
  priority: true,
});

/** Unsent text kept by the list page when the dialog closes (attachments are not kept). */
export interface CreateTicketDraft {
  title: string;
  description: string;
  category_id?: number;
  priority: TicketPriority;
  /**
   * The Idempotency-Key of an attempt whose outcome is unknown (the connection
   * dropped after sending, a 5xx, a 409 "still in flight"). Kept with the draft
   * together with the EXACT body that was sent (`pendingPayload`), so a close →
   * reopen → Create resends that body under that key: the server replays the
   * stored 201 (it was created), waits for the first execution, or runs it
   * afresh when the first one failed — it can never file the ticket twice.
   */
  pendingKey?: string;
  /** the body sent with `pendingKey` (frozen; the fields stay locked until the attempt resolves) */
  pendingPayload?: CreateTicketPayload;
}

export type CreateTicketBanner = { tone: "error" | "info"; message: string } | null;

export const CATEGORY_GONE_MESSAGE = "That category is no longer available. Pick another one.";

/** How long a found ticket may predate the attempt and still be "this" ticket (clock skew + queueing). */
const CONFIRM_WINDOW_MS = 10 * 60_000;

const isMachineCode = (message: string) => (SUPPORT_ERROR_CODES as readonly string[]).includes(message);

/** The outcome of the attempt is unknown (it may have been created): keep the key for the retry. */
const outcomeUnknown = (fail: SupportFail) =>
  fail.code === "NETWORK" ||
  fail.code === "CONCURRENT_UPDATE" ||
  fail.code === "TICKET_BUSY" ||
  fail.status === 0 ||
  fail.status === 499 ||
  fail.status >= 500;

/**
 * Answers that say NOTHING about an earlier attempt with the same key, because they are produced
 * before the API's idempotency step runs (ticket.route.ts: the create limiter, then
 * `validateRequest`, then `idempotent()`) or by the session layer: a 429 or a 401. After one of
 * these an unknown-outcome attempt stays unknown, so its key and body are kept.
 */
const saysNothingAboutEarlier = (fail: SupportFail) =>
  fail.code === "RATE_LIMITED" || fail.code === "SESSION_EXPIRED" || fail.status === 429 || fail.status === 401;

interface PendingAttempt {
  key: string;
  payload: CreateTicketPayload;
}

export type CreateTicketFormValues = z.infer<typeof createTicketFormSchema>;

type FormField = keyof CreateTicketFormValues;

const FIELD_FOR_PATH: Record<string, FormField> = {
  title: "title",
  description: "description",
  category_id: "category_id",
  category: "category_id",
  priority: "priority",
};

interface UseCreateTicketSubmissionOptions {
  form: UseFormReturn<CreateTicketFormValues>;
  /** the form element — where focus goes back after a refused send (its submit button as the fallback) */
  formRef: RefObject<HTMLFormElement | null>;
  uploads: SupportUploads;
  /** a restored draft (its unknown-outcome attempt is resumed) */
  initialValues?: Partial<CreateTicketDraft>;
  reopenedFrom?: { id: number } | null;
  onCreated: (ticket: TicketRequesterDetail) => void;
  onBusyChange?: (busy: boolean) => void;
  onCategoryHidden?: () => void;
  onDuplicateDetected?: () => void;
  /** the unsent draft changed (every edit, an attempt kept or dropped; null once created) */
  onDraftChange?: (draft: CreateTicketDraft | null) => void;
}

/**
 * The create form's submission protocol (step-9a review): one Idempotency-Key per body, a
 * synchronous double-submit guard, and the unknown-outcome rules — the key AND the exact body are
 * kept, the fields lock, and Create resends that frozen body under that key until the server gives
 * a definite answer: 201 (created or replayed) or a handler-level refusal (no ticket: unlock, edit,
 * new key). A 429 / 401 in between changes nothing (they come before the idempotency step). An
 * IDEMPOTENCY_KEY_REUSED is checked against the list before the form ever says the ticket exists.
 */
export function useCreateTicketSubmission({
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
}: UseCreateTicketSubmissionOptions) {
  const idem = useIdempotencyKey();
  // Restored with the draft: an unknown-outcome attempt from before the dialog closed (key + body).
  const [restoredAttempt] = useState<PendingAttempt | null>(() =>
    initialValues?.pendingKey && initialValues.pendingPayload
      ? { key: initialValues.pendingKey, payload: initialValues.pendingPayload }
      : null,
  );
  const pendingRef = useRef<PendingAttempt | null>(restoredAttempt);
  const [pendingAttempt, setPendingAttemptState] = useState(restoredAttempt !== null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<CreateTicketBanner>(() =>
    restoredAttempt
      ? {
          tone: "info",
          message:
            "Your last attempt may already have gone through. Press Create ticket to check — it won't be sent twice.",
        }
      : null,
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Set when a send is refused: every field is `disabled` while the request runs, so the field the
   * user submitted from (Ctrl/⌘+Enter in the Description) dropped focus to <body>, and a
   * `setError(…, { shouldFocus })` issued then hits a disabled field and does nothing. Once the
   * form unlocks, focus goes to the field the server named, else back where the user was, else the
   * submit button (step-9c review; the reply composer's `refocusRef`).
   */
  const refocusRef = useRef<{ field: FormField | null; origin: HTMLElement | null } | null>(null);
  useEffect(() => {
    const target = refocusRef.current;
    if (submitting || !target) return;
    refocusRef.current = null;
    if (target.field) {
      form.setFocus(target.field);
      return;
    }
    const active = document.activeElement;
    if (active && active !== document.body) return; // focus survived (the aria-disabled submit button) or moved on
    const origin = target.origin?.isConnected && !target.origin.matches(":disabled") ? target.origin : null;
    (origin ?? formRef.current?.querySelector<HTMLElement>("[data-support-submit]"))?.focus();
  }, [form, formRef, submitting]);

  // The caller's copy of the draft (kept when the dialog closes).
  const reportDraft = useCallback(
    (values: Partial<CreateTicketFormValues>) => {
      onDraftChange?.({
        title: values.title ?? "",
        description: values.description ?? "",
        category_id: values.category_id ? values.category_id : undefined,
        priority: values.priority ?? "medium",
        pendingKey: pendingRef.current?.key,
        pendingPayload: pendingRef.current?.payload,
      });
    },
    [onDraftChange],
  );

  useEffect(() => {
    if (!onDraftChange) return;
    const subscription = form.watch((values) => reportDraft(values));
    return () => subscription.unsubscribe();
  }, [form, onDraftChange, reportDraft]);

  /** Keep (or drop) the unknown-outcome attempt; while one is kept the fields are locked. */
  const setPending = (attempt: PendingAttempt | null) => {
    pendingRef.current = attempt;
    if (mountedRef.current) setPendingAttemptState(attempt !== null);
    // a kept attempt's uploads may belong to the ticket it created: never delete them on close
    uploads.setSubmitLock(attempt !== null);
    reportDraft(form.getValues());
  };

  const setBusy = (busy: boolean) => {
    submittingRef.current = busy;
    if (mountedRef.current) setSubmitting(busy);
    onBusyChange?.(busy);
  };

  /** Puts each server message on its field; returns the first such field (focused once the form unlocks). */
  const applyFieldErrors = (fail: SupportFail): FormField | null => {
    let first: FormField | null = null;
    for (const entry of fail.errors) {
      if (isMachineCode(entry.message)) continue;
      const key = entry.path.split(".").pop() ?? "";
      const field = FIELD_FOR_PATH[key];
      if (field) {
        form.setError(field, { type: "server", message: entry.message });
        first ??= field;
      }
    }
    return first;
  };

  /** The server holds the ticket, the form cannot show it: hand over to the caller (or say so). */
  const createdElsewhere = (message: string) => {
    if (onDuplicateDetected) {
      onDuplicateDetected();
      return;
    }
    setBanner({ tone: "info", message });
  };

  /**
   * IDEMPOTENCY_KEY_REUSED: the key is stored with ANOTHER body. That alone does not prove a ticket
   * exists (the first execution may still be running, or fail later and release the key), so look
   * for it — same title, created since shortly before the attempt — before saying so. Not found →
   * say we could not confirm, keep everything typed, and let the next press use a fresh key.
   */
  const confirmEarlierAttempt = async (payload: CreateTicketPayload, startedAt: number) => {
    setBusy(true);
    const found = await supportApi.listTickets({ q: payload.title, page: 1, limit: 5 });
    if (!mountedRef.current) {
      onBusyChange?.(false);
      return;
    }
    setBusy(false);
    const match =
      found.ok &&
      found.data.some(
        (row) =>
          row.title.trim() === payload.title.trim() && Date.parse(row.created_at) >= startedAt - CONFIRM_WINDOW_MS,
      );
    idem.reset();
    setPending(null);
    if (match) {
      createdElsewhere("Your earlier attempt already created this ticket, so we didn't send it twice. Check your ticket list.");
      return;
    }
    setBanner({
      tone: "error",
      message:
        "We couldn't confirm whether your earlier attempt went through. Check your ticket list first; if it isn't there, press Create ticket to send it.",
    });
  };

  /** Settles a refused send; returns the field the server named (to focus once the form unlocks). */
  const handleFailure = (fail: SupportFail, attempt: PendingAttempt, startedAt: number): FormField | null => {
    if (fail.status >= 200 && fail.status < 300) {
      // A 2xx whose body failed the narrower: it WAS created. Keep the attempt, so a
      // retry replays the stored answer instead of filing it twice.
      setPending(attempt);
      createdElsewhere("Your ticket was created, but we couldn't show it here. Check your ticket list.");
      return null;
    }
    if (fail.code === "IDEMPOTENCY_KEY_REUSED") {
      void confirmEarlierAttempt(attempt.payload, startedAt);
      return null;
    }
    if (outcomeUnknown(fail)) {
      setPending(attempt);
    } else if (saysNothingAboutEarlier(fail)) {
      // keep an earlier unknown attempt exactly as it was; a fresh attempt simply was not run
      if (pendingRef.current?.key !== attempt.key) setPending(null);
    } else {
      // A definite refusal of this body: no ticket was created with it → unlock, edits get a new key.
      setPending(null);
    }
    switch (fail.code) {
      case "CATEGORY_HIDDEN":
        form.setError("category_id", { type: "server", message: CATEGORY_GONE_MESSAGE });
        onCategoryHidden?.();
        return "category_id";
      case "ATTACHMENT_INVALID":
        setBanner({
          tone: "error",
          message: `${fail.message || "One of the attachments was refused."} Remove it and try again.`,
        });
        return null;
      case "RATE_LIMITED":
        setBanner({
          tone: "error",
          message: fail.retryAfterMs
            ? `You've created a lot of tickets in a short time. Please try again in ${waitPhrase(fail.retryAfterMs)}.`
            : "You've created a lot of tickets in a short time. Please wait a little and try again.",
        });
        return null;
      case "SESSION_EXPIRED":
        return null; // the client redirects to /session-expired
      default:
        break;
    }
    if (fail.status === 400 || fail.status === 422) {
      const field = applyFieldErrors(fail);
      if (field) return field;
    }
    if (outcomeUnknown(fail)) {
      setBanner({
        tone: "error",
        message:
          fail.code === "CONCURRENT_UPDATE"
            ? "Your ticket is still being sent. Wait a moment, then press Create ticket again — it won't be duplicated. The form stays as it is until we know."
            : "We couldn't reach the server, so we don't know if your ticket was sent. Press Create ticket again to check — it won't be duplicated. The form stays as it is until we know.",
      });
      return null;
    }
    setBanner({ tone: "error", message: supportErrorMessage(fail, "We couldn't create your ticket. Please try again.") });
    return null;
  };

  /** One POST of `attempt`; every outcome is settled here. */
  const send = async (attempt: PendingAttempt) => {
    // where the user was (read before the fields lock): focus returns there if the send is refused
    const active = document.activeElement;
    const origin = active instanceof HTMLElement && formRef.current?.contains(active) ? active : null;
    setBanner(null);
    setBusy(true);
    uploads.setSubmitLock(true);
    const startedAt = Date.now();
    const result = await supportApi.createTicket(attempt.payload, { idempotencyKey: attempt.key });
    if (!mountedRef.current) {
      onBusyChange?.(false);
      return;
    }
    if (result.ok) {
      idem.reset();
      pendingRef.current = null;
      setPendingAttemptState(false);
      uploads.reset(); // the files belong to the ticket now — never delete them
      onDraftChange?.(null);
      setBusy(false);
      onCreated(result.data);
      return;
    }
    // the lock stays while an attempt is kept (its uploads may be the created ticket's)
    uploads.setSubmitLock(pendingRef.current !== null);
    setBusy(false);
    if (result.aborted) return;
    refocusRef.current = { field: handleFailure(result, attempt, startedAt), origin };
  };

  const submitValidated = form.handleSubmit(async (values) => {
    // Synchronous guard: a double click lands before React re-renders the disabled button.
    if (submittingRef.current) return;
    if (uploads.uploading) {
      setBanner({ tone: "info", message: "Wait for your attachments to finish uploading." });
      return;
    }
    if (uploads.hasErrors) {
      setBanner({ tone: "error", message: "Retry or remove the attachments that failed to upload." });
      return;
    }
    const candidate = {
      title: values.title.trim(),
      description: values.description.trim(),
      category_id: values.category_id,
      priority: values.priority,
      attachment_ids: uploads.ids,
      ...(reopenedFrom ? { reopened_from_id: reopenedFrom.id } : {}),
    };
    const parsed = newTicketSchema.safeParse(candidate);
    if (!parsed.success) {
      setBanner({ tone: "error", message: parsed.error.issues[0]?.message ?? "Check the form and try again." });
      return;
    }
    const payload: CreateTicketPayload = {
      title: parsed.data.title,
      description: parsed.data.description,
      category_id: parsed.data.category_id,
      priority: parsed.data.priority,
      attachment_ids: parsed.data.attachment_ids,
      ...(parsed.data.reopened_from_id ? { reopened_from_id: parsed.data.reopened_from_id } : {}),
    };

    await send({ key: idem.keyFor(payload), payload });
  });

  /**
   * Create: an unknown-outcome attempt is resolved first — its frozen body under its key, whatever
   * the (locked) fields show — and only a definite answer lets the user edit and send anew.
   */
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const pending = pendingRef.current;
    if (!pending) return submitValidated(event);
    event.preventDefault();
    if (submittingRef.current) return;
    return send(pending);
  };

  return { submitting, pendingAttempt, banner, onSubmit };
}
