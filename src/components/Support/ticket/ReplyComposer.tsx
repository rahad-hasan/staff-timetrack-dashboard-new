"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { Check, CircleAlert, Copy, Paperclip, RotateCw, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING, notifySupport, SupportAlert, SupportButton, useSupportUploads } from "@/components/Support/primitives";
import type { SupportFail } from "@/lib/support";
import { SUPPORT_ATTACHMENT_ACCEPT, normalisePastedFile } from "@/lib/supportAttachments";
import { SUPPORT_LIMITS } from "@/zod/supportSchema";
import type { PostMessageResult } from "@/types/support";
import { ComposerAttachments } from "./ComposerAttachments";
import type { PendingReply } from "./threadState";
import { useReplySubmission } from "./useReplySubmission";
import { useTypingSignal } from "./useTypingSignal";
import type { OwnEcho } from "./useTicketRealtime";

export interface ReplyComposerProps {
  ticketId: number;
  /** status allows a reply (`can_reply`) */
  canReply: boolean;
  /** the ticket is closed: the box stays on the page, disabled, with the reason (§5.5 read-only thread) */
  closed?: boolean;
  /** the agent's name for the placeholder ("Write a reply to Priya…") */
  agentFirstName: string | null;
  onOptimistic: (pending: PendingReply) => void;
  onSent: (tempId: string, result: PostMessageResult) => void;
  onFailed: (tempId: string, failure: SupportFail) => void;
  /**
   * The requester's own newest message as the socket delivered it. When a send
   * "failed" only because the answer was lost (the server stored it — its echo
   * arrives), the matching draft is treated as sent instead of asking to retry.
   */
  ownEcho?: OwnEcho | null;
  /** `ticket:typing` on the `/support` namespace (the console's "is typing" line); absent = no signal */
  onTyping?: (isTyping: boolean) => void;
}

const COUNTER_FROM = 9_000;
const MAX_TEXTAREA_PX = 280;
const COPIED_MS = 1600;

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

/**
 * Replies off (closed / not allowed) and nothing typed: the box stays where it was, disabled, so the
 * card keeps its height and the reason sits where the reader looks for the composer.
 */
const ComposerUnavailable = ({ closed }: { closed: boolean }) => {
  const ids = useId();
  const textareaId = `${ids}-reply`;
  const hintId = `${ids}-hint`;
  return (
    <section
      aria-label="Reply to support (unavailable)"
      data-composer="disabled"
      className="rounded-xl border border-support-divider bg-bgSecondary dark:border-darkBorder dark:bg-darkTertiaryBg"
    >
      <label htmlFor={textareaId} className="sr-only">
        Reply to support
      </label>
      <textarea
        id={textareaId}
        disabled
        rows={3}
        placeholder={closed ? "This ticket is closed, so replies are turned off." : "Replies are turned off for this ticket."}
        aria-describedby={hintId}
        className="block h-24 w-full cursor-not-allowed resize-none rounded-t-xl bg-transparent px-4 pb-2 pt-3.5 text-[15px] leading-[23px] outline-none placeholder:text-support-muted-text dark:placeholder:text-darkTextSecondary"
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 pb-3 pt-1">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-lg text-subTextColor opacity-50 dark:text-darkTextSecondary"
        >
          <Paperclip className="size-[18px]" />
        </span>
        <p id={hintId} className="min-w-0 flex-1 text-[12.5px] leading-[18px] text-support-muted-text dark:text-darkTextSecondary">
          {closed ? "Open a new ticket to continue the conversation." : "You can't reply to this ticket right now."}
        </p>
        <SupportButton variant="primary" size="md" icon={<SendHorizontal />} disabled className="ml-auto">
          Send reply
        </SupportButton>
      </div>
    </section>
  );
};

/**
 * A draft that existed when the ticket closed: readable and copyable, never sendable. It replaces
 * the live composer, whose textarea (focused while typing, or disabled while a reply was in
 * flight) leaves the DOM with it — so when focus fell to <body>, it moves to "Copy text" (the one
 * action left) instead of sending a keyboard user back through the app shell (step-9c review).
 * The page's live region announces why (TicketPageView `onFailed` / the status event).
 */
const UnsentDraft = ({ text }: { text: string }) => {
  const ids = useId();
  const textareaId = `${ids}-reply`;
  const hintId = `${ids}-hint`;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const copyRef = useRef<HTMLButtonElement | null>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );
  useEffect(() => {
    const active = document.activeElement;
    if (!active || active === document.body) copyRef.current?.focus();
  }, []);

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      textareaRef.current?.select();
    }
  };

  return (
    <section aria-label="Unsent reply" className="rounded-xl border border-borderColor bg-bgSecondary dark:border-darkBorder dark:bg-darkTertiaryBg">
      <label htmlFor={textareaId} className="sr-only">
        Your unsent reply
      </label>
      <textarea
        id={textareaId}
        ref={textareaRef}
        value={text}
        readOnly
        aria-describedby={hintId}
        className="block w-full resize-none rounded-t-xl bg-transparent px-4 pt-3.5 text-[15px] leading-[23px] text-subTextColor outline-none dark:text-darkTextSecondary"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-support-divider px-4 py-2.5 dark:border-darkBorder">
        <p id={hintId} className="text-[13px] leading-5 text-subTextColor dark:text-darkTextSecondary">
          This reply wasn&apos;t sent because the ticket is closed.
        </p>
        <SupportButton ref={copyRef} variant="outline" size="sm" icon={copied ? <Check /> : <Copy />} onClick={() => void copyDraft()}>
          {copied ? "Copied" : "Copy text"}
        </SupportButton>
      </div>
    </section>
  );
};

/**
 * The reply box (TD-01 composer, requester side; #a5c3fa border, toolbar
 * inside the box with no divider, Send reply 12px from the edges): textarea
 * that grows to 280 px, attachments by picker / drag-and-drop / paste (useSupportUploads:
 * 10 files × 10 MB, 3 in parallel, orphan cleanup), Ctrl/⌘+Enter sends
 * (Enter is a new line — the app's convention, v1 composer). The send
 * protocol (optimistic, idempotent, rolled back on failure) is
 * `useReplySubmission`; a closed ticket shows `ComposerUnavailable`, or the
 * `UnsentDraft` with a Copy button when a draft existed.
 */
export const ReplyComposer = ({
  ticketId,
  canReply,
  closed = false,
  agentFirstName,
  onOptimistic,
  onSent,
  onFailed,
  ownEcho = null,
  onTyping,
}: ReplyComposerProps) => {
  const [dragging, setDragging] = useState(false);
  // The server cannot know the platform: render the default, switch after mount (no hydration mismatch on a Mac)
  const [shortcut, setShortcut] = useState("Ctrl + Enter");
  useEffect(() => {
    if (isMac()) setShortcut("⌘ + Enter");
  }, []);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepth = useRef(0);
  const uploads = useSupportUploads({ max: SUPPORT_LIMITS.ATTACHMENTS_MAX });
  const { text, edit, sending, error, retryable, submit } = useReplySubmission({
    ticketId,
    canReply,
    uploads,
    onOptimistic,
    onSent,
    onFailed,
    ownEcho,
    textareaRef,
    sectionRef,
  });
  const ids = useId();
  const textareaId = `${ids}-reply`;
  const hintId = `${ids}-hint`;
  const errorId = `${ids}-error`;
  const typing = useTypingSignal(onTyping);
  // a send ends the signal (its message lands in the console a moment later)
  useEffect(() => {
    if (sending) typing.stop();
  }, [sending, typing]);

  // Auto-grow without layout shift of the rest of the card.
  useLayoutEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(MAX_TEXTAREA_PX, Math.max(96, node.scrollHeight))}px`;
  }, [text]);

  // Ticket closed: pending uploads can never be sent — release them (the text stays copyable).
  const { items: uploadItems, remove: removeUpload } = uploads;
  useEffect(() => {
    if (canReply || sending) return;
    uploadItems.forEach((item) => removeUpload(item.localId));
  }, [canReply, sending, uploadItems, removeUpload]);

  const trimmed = text.trim();
  const tooLong = trimmed.length > SUPPORT_LIMITS.MESSAGE_MAX;
  const hasContent = trimmed.length > 0 || uploads.ids.length > 0;
  const blockedByUploads = uploads.uploading || uploads.hasErrors;
  const canSend = canReply && !sending && hasContent && !tooLong && !blockedByUploads;

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const { rejected } = uploads.addFiles(files);
      rejected.slice(0, 3).forEach((reason) => notifySupport.warning("File not added", { description: reason }));
      if (rejected.length > 3) {
        notifySupport.warning(`${rejected.length - 3} more files were not added`);
      }
    },
    [uploads],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (canSend) void submit();
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData?.files ?? []);
    if (files.length === 0) return;
    event.preventDefault();
    addFiles(files.map(normalisePastedFile));
  };

  const onDragEnter = (event: DragEvent<HTMLElement>) => {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (event: DragEvent<HTMLElement>) => {
    if (!event.dataTransfer?.files?.length) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (!canReply || sending) return;
    addFiles(Array.from(event.dataTransfer.files));
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  if (!canReply && !sending) {
    return text ? <UnsentDraft text={text} /> : <ComposerUnavailable closed={closed} />;
  }

  const counterVisible = trimmed.length >= COUNTER_FROM;

  return (
    <section
      ref={sectionRef}
      aria-label="Reply to support"
      onDragEnter={onDragEnter}
      onDragOver={(event) => {
        if (event.dataTransfer?.types?.includes("Files")) event.preventDefault();
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        // TD-01 / TD-06 draw the reply box with a #a5c3fa border at rest; focus turns it the solid
        // brand blue (#0788f3, 3.6:1 — the earlier #7fa9f6 read 2.36:1) plus the soft halo
        "relative rounded-xl border bg-white transition-[border-color,box-shadow] duration-150 dark:bg-darkPrimaryBg",
        "focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(7,136,243,0.12)]",
        error ? "border-[#ffc9c9] dark:border-[#fb2c36]/50" : "border-[#a5c3fa] dark:border-darkBorder",
        dragging && "border-dashed border-primary bg-[#f8fbff]",
      )}
    >
      {error ? (
        <SupportAlert
          id={errorId}
          role="alert"
          tone="error"
          layout="strip"
          icon={<CircleAlert />}
          action={
            retryable ? (
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!canSend}
                className={cn("inline-flex items-center gap-1.5 rounded-md text-[13.5px] font-medium text-support-primary-text outline-none hover:underline disabled:opacity-60 dark:text-support-primary-text-dark", FOCUS_RING)}
              >
                <RotateCw aria-hidden="true" className="size-3.5" />
                Retry
              </button>
            ) : null
          }
        >
          {error}
        </SupportAlert>
      ) : null}

      <label htmlFor={textareaId} className="sr-only">
        Reply to support
      </label>
      <textarea
        id={textareaId}
        ref={textareaRef}
        value={text}
        onChange={(event) => {
          edit(event.target.value);
          typing.input(event.target.value);
        }}
        onBlur={typing.stop}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        disabled={sending}
        rows={3}
        placeholder={agentFirstName ? `Write a reply to ${agentFirstName}…` : "Write a reply…"}
        aria-describedby={[hintId, error ? errorId : null].filter(Boolean).join(" ")}
        aria-invalid={tooLong || undefined}
        className="block min-h-24 w-full resize-none bg-transparent px-4 pb-2 pt-3.5 text-[15px] leading-[23px] text-headingTextColor outline-none placeholder:text-support-muted-text disabled:cursor-not-allowed disabled:opacity-70 dark:text-darkTextPrimary"
      />

      {uploads.items.length > 0 && !sending ? (
        <ComposerAttachments items={uploads.items} onRemove={uploads.remove} onRetry={uploads.retry} disabled={sending} />
      ) : null}

      {/* TD-01 / TD-13: the toolbar sits inside the box (no divider), Send reply 12px from the edges */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 pb-3 pt-1">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={SUPPORT_ATTACHMENT_ACCEPT}
          onChange={onPick}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || uploads.isFull}
          aria-label={uploads.isFull ? `Attachment limit reached (${uploads.max})` : "Attach files"}
          title={uploads.isFull ? `Up to ${uploads.max} files per reply` : "Attach files (or paste / drop them)"}
          className={cn("flex size-9 items-center justify-center rounded-lg text-subTextColor outline-none transition-colors hover:bg-support-surface-muted hover:text-headingTextColor disabled:cursor-not-allowed disabled:opacity-50 dark:text-darkTextSecondary dark:hover:bg-white/10", FOCUS_RING)}
        >
          <Paperclip aria-hidden="true" className="size-[18px]" />
        </button>
        <p id={hintId} className="min-w-0 flex-1 text-[12.5px] leading-[18px] text-support-muted-text dark:text-darkTextSecondary">
          {uploads.uploading ? (
            "Uploading attachments…"
          ) : (
            <>
              <span className="hidden sm:inline">{shortcut} to send · </span>
              {counterVisible ? (
                <span className={cn(tooLong && "font-medium text-[#c10007] dark:text-[#ffa2a2]")}>
                  {trimmed.length.toLocaleString("en-US")} / {SUPPORT_LIMITS.MESSAGE_MAX.toLocaleString("en-US")}
                  {tooLong ? " — shorten your reply to send it" : ""}
                </span>
              ) : (
                <span>Files up to 10 MB</span>
              )}
            </>
          )}
        </p>
        <SupportButton
          variant="primary"
          size="md"
          icon={<SendHorizontal />}
          loading={sending}
          disabled={!canSend}
          onClick={() => void submit()}
          className="ml-auto"
        >
          {sending ? "Sending…" : "Send reply"}
        </SupportButton>
      </div>

      {dragging ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-support-primary-tint/90 text-[14px] font-medium text-support-primary-text dark:bg-darkTertiaryBg/90 dark:text-support-primary-text-dark"
        >
          Drop files to attach them
        </div>
      ) : null}
    </section>
  );
};

export default ReplyComposer;
