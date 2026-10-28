"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useIdempotencyKey, type SupportUploads } from "@/components/Support/primitives";
import { supportApi, supportErrorMessage, type SupportFail } from "@/lib/support";
import { replySchema } from "@/zod/supportSchema";
import type { PostMessageResult } from "@/types/support";
import { isCopyOfReply, type PendingReply } from "./threadState";
import type { OwnEcho } from "./useTicketRealtime";

const failureCopy = (failure: SupportFail): string => {
  switch (failure.code) {
    case "TICKET_CLOSED":
      return "This ticket was closed, so your reply wasn't sent. Your text is kept below.";
    case "RATE_LIMITED":
      return "You're sending replies too quickly. Wait a moment, then try again.";
    case "NETWORK":
      return "Your reply wasn't sent — check your connection and try again.";
    default:
      return supportErrorMessage(failure, "Your reply wasn't sent. Please try again.");
  }
};

interface UseReplySubmissionOptions {
  ticketId: number;
  canReply: boolean;
  uploads: SupportUploads;
  onOptimistic: (pending: PendingReply) => void;
  onSent: (tempId: string, result: PostMessageResult) => void;
  onFailed: (tempId: string, failure: SupportFail) => void;
  /** the requester's own newest message as the socket delivered it */
  ownEcho: OwnEcho | null;
  /** the reply box — focused after a send settles and on a validation error */
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  /** the composer card — focus inside it counts as "still in the composer" */
  sectionRef: RefObject<HTMLElement | null>;
}

/**
 * The reply's send protocol (§8.1): one Idempotency-Key per submission (same body → same key, so
 * Retry after a timeout replays instead of duplicating), optimistic (the bubble appears and the box
 * empties at once), locked while in flight, rolled back on failure (text and chips restored, Retry
 * offered when it can help). A synchronous guard stops two activations in one task (double click,
 * Enter + Ctrl+Enter) before the re-render that disables Send (step-9a review). A "failure" whose
 * answer was only lost is settled by the message's own socket echo: the matching draft is cleared.
 */
export function useReplySubmission({
  ticketId,
  canReply,
  uploads,
  onOptimistic,
  onSent,
  onFailed,
  ownEcho,
  textareaRef,
  sectionRef,
}: UseReplySubmissionOptions) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const idem = useIdempotencyKey();
  const mountedRef = useRef(true);
  const sendingRef = useRef(false);
  const sendStartedAtRef = useRef(Number.POSITIVE_INFINITY);
  /** set when a send settles: the box was locked (disabled) so focus fell to <body> — give it back */
  const refocusRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // After a send settles, return focus to the box once it is enabled again (an effect runs after the
  // commit; focusing from a rAF could hit the still-disabled textarea) — unless the user moved on.
  useEffect(() => {
    if (sending || !refocusRef.current) return;
    refocusRef.current = false;
    const active = document.activeElement;
    if (!active || active === document.body || sectionRef.current?.contains(active)) textareaRef.current?.focus();
  }, [sectionRef, sending, textareaRef]);

  // A lost answer whose message did land: the echo matches the restored draft → it was sent.
  const { ids: uploadIds, reset: resetUploads } = uploads;
  const { reset: resetKey } = idem;
  useEffect(() => {
    if (!ownEcho || !error || !retryable || sending) return;
    // only an echo that arrived after this submission started can be its copy
    if (ownEcho.receivedAt < sendStartedAtRef.current) return;
    if (!isCopyOfReply({ body: text, attachmentIds: uploadIds }, ownEcho.message)) return;
    setText("");
    resetUploads();
    resetKey();
    setError(null);
    setRetryable(false);
  }, [ownEcho, error, retryable, sending, text, uploadIds, resetUploads, resetKey]);

  const fail = (message: string) => {
    setError(message);
    setRetryable(false);
  };

  const submit = async () => {
    if (sendingRef.current || sending || !canReply) return;
    const body = text.trim();
    const parsed = replySchema.safeParse({ body, attachment_ids: uploads.ids });
    if (!parsed.success) {
      fail(parsed.error.issues[0]?.message ?? "Write a message or attach a file.");
      textareaRef.current?.focus();
      return;
    }
    if (uploads.uploading) return fail("Wait for the attachments to finish uploading.");
    if (uploads.hasErrors) return fail("Retry or remove the attachments that failed to upload.");

    const payload = { ...(body ? { body } : {}), attachment_ids: [...uploads.ids] };
    const idempotencyKey = idem.keyFor(payload);
    const tempId = `pending-${idempotencyKey}`;
    const draftText = text;
    const doneItems = uploads.items.filter((item) => item.status === "done" && item.uploaded);

    sendingRef.current = true;
    setSending(true);
    setError(null);
    setRetryable(false);
    sendStartedAtRef.current = Date.now();
    uploads.setSubmitLock(true);
    onOptimistic({
      tempId,
      body,
      attachmentIds: payload.attachment_ids,
      createdAt: new Date().toISOString(),
      files: doneItems.map((item) => ({
        localId: item.localId,
        name: item.name,
        size: item.size,
        isImage: item.isImage,
        previewUrl: item.previewUrl,
      })),
    });
    setText("");

    let result: Awaited<ReturnType<typeof supportApi.postMessage>>;
    try {
      result = await supportApi.postMessage(ticketId, payload, { idempotencyKey });
    } finally {
      sendingRef.current = false;
    }
    if (result.ok) {
      onSent(tempId, result.data);
      if (!mountedRef.current) return;
      uploads.reset();
      idem.reset();
      refocusRef.current = true;
      setSending(false);
      return;
    }

    uploads.setSubmitLock(false);
    onFailed(tempId, result);
    if (!mountedRef.current) return;
    refocusRef.current = true;
    setSending(false);
    setText((current) => (current ? current : draftText));
    if (result.code === "IDEMPOTENCY_KEY_REUSED" || result.code === "IDEMPOTENCY_KEY_INVALID") idem.reset();
    setError(failureCopy(result));
    setRetryable(result.code !== "TICKET_CLOSED" && result.code !== "VALIDATION" && result.code !== "ATTACHMENT_INVALID");
  };

  /** typing clears a validation message (a send failure stays until Retry or the next send) */
  const edit = useCallback(
    (next: string) => {
      setText(next);
      if (error && !retryable) setError(null);
    },
    [error, retryable],
  );

  return { text, edit, sending, error, retryable, submit };
}
