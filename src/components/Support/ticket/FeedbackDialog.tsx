"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING, SupportAlert, SupportButton, SupportDialog, UserAvatar } from "@/components/Support/primitives";
import { supportApi, supportErrorMessage, type SupportFail } from "@/lib/support";
import { feedbackSchema, SUPPORT_LIMITS } from "@/zod/supportSchema";
import {
  FEEDBACK_HIGHLIGHT_LABELS,
  FEEDBACK_HIGHLIGHT_VALUES,
  RATING_GRADES,
  type FeedbackHighlight,
  type FeedbackResult,
  type Rating,
  type UserRef,
} from "@/types/support";
import { HIGHLIGHT_TONE, HIGHLIGHT_TONE_CLASS } from "./highlights";
import { StarRating } from "./StarRating";

export interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: number;
  displayNumber: string;
  /** a closed ticket can still be rated (`can_rate`): the description says "closed" then, not "resolved" */
  closed?: boolean;
  agent: UserRef | null;
  /** "Maybe later" is offered only when the owner allows it (SS-06 "Allow 'Rate later'", REQ-U-23) */
  rateLaterEnabled: boolean;
  /** the dialog was dismissed without rating ("Maybe later" / × / Escape) */
  onDismiss: () => void;
  onRated: (feedback: FeedbackResult) => void;
  /** the server refused because the state moved on (already rated / not resolved) */
  onRejected: (failure: SupportFail) => void;
  /**
   * Focus target on close when the opener is gone or never existed (the popup auto-opens on a
   * resolve) — SupportDialog returns focus to the opener itself otherwise.
   */
  returnFocusTo?: () => HTMLElement | null;
}

const COMMENT_COUNTER_FROM = 1_600;
/** setTimeout's ceiling (≈ 24.8 days); a longer Retry-After re-arms on the next refusal */
const MAX_TIMER_MS = 2_147_483_647;

/** "3:45 PM" — an absolute time stays true however long the popup stays open or is reopened later */
const clockTime = (epochMs: number) => new Date(epochMs).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/**
 * "Rate your agent" (Flow 3; the admin's Requester-rating card is its
 * result): stars (radio group, required), the §4.4 highlight chips (toggle
 * buttons, up to 5), an optional comment (≤ 2 000), Submit, and "Maybe
 * later" when the owner's "Allow 'Rate later'" setting is on (the requester
 * copy of §3.4 F3 / §5.5 / REQ-U-23 — the setting's name is admin-side
 * vocabulary). Busy while submitting (no close, no Escape); a synchronous
 * guard stops a second activation in the same task (two POSTs before the
 * disabled state renders — step-9a review). Every open starts a fresh form
 * (reset while rendering the opening, so no frame shows the last answers). The
 * highlight vocabulary is embedded from the backend constants: the
 * requester cannot read `GET /support/meta` (staff only).
 */
export const FeedbackDialog = ({
  open,
  onOpenChange,
  ticketId,
  displayNumber,
  closed = false,
  agent,
  rateLaterEnabled,
  onDismiss,
  onRated,
  onRejected,
  returnFocusTo,
}: FeedbackDialogProps) => {
  const [rating, setRating] = useState<Rating | null>(null);
  const [highlights, setHighlights] = useState<FeedbackHighlight[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  /**
   * The feedback limiter refused with a Retry-After (backend: per user, refused requests count):
   * Submit stays held until then — every press would only be refused again and push the wait out
   * (step-9c review). Kept across reopenings of the popup; cleared by its own timer.
   */
  const [heldUntil, setHeldUntil] = useState<number | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  const id = useId();
  const labelId = `${id}-label`;
  const ratingErrorId = `${id}-rating-error`;
  const commentId = `${id}-comment`;
  const commentHintId = `${id}-comment-hint`;
  const chipsLabelId = `${id}-chips`;
  const heldId = `${id}-held`;

  // A fresh form each time the popup opens — adjusted during the render that opens it.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setRating(null);
      setHighlights([]);
      setComment("");
      setError(null);
      setTouched(false);
    }
  }

  useEffect(() => {
    if (heldUntil === null) return;
    const timer = setTimeout(() => setHeldUntil(null), Math.min(MAX_TIMER_MS, Math.max(0, heldUntil - Date.now())));
    return () => clearTimeout(timer);
  }, [heldUntil]);

  const agentName = agent?.name?.trim() || null;
  const commentLength = comment.trim().length;
  const commentTooLong = commentLength > SUPPORT_LIMITS.COMMENT_MAX;

  const toggleHighlight = (value: FeedbackHighlight) => {
    setHighlights((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : current.length >= SUPPORT_LIMITS.HIGHLIGHTS_MAX
          ? current
          : [...current, value],
    );
  };

  const submit = async () => {
    if (submittingRef.current || heldUntil !== null) return;
    setTouched(true);
    const parsed = feedbackSchema.safeParse({ rating: rating ?? 0, highlights, comment });
    if (!parsed.success || rating === null) {
      const issue = parsed.success ? null : parsed.error.issues[0];
      setError(rating === null || issue?.path[0] === "rating" ? null : (issue?.message ?? "Check the form and try again."));
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    const trimmed = comment.trim();
    let result: Awaited<ReturnType<typeof supportApi.submitFeedback>>;
    try {
      result = await supportApi.submitFeedback(ticketId, {
        rating,
        highlights,
        ...(trimmed ? { comment: trimmed } : {}),
      });
    } finally {
      submittingRef.current = false;
    }
    setSubmitting(false);
    if (result.ok) {
      onRated(result.data);
      onOpenChange(false);
      return;
    }
    if (result.code === "FEEDBACK_EXISTS" || result.code === "FEEDBACK_NOT_ALLOWED" || result.code === "INVALID_STATE") {
      onRejected(result);
      onOpenChange(false);
      return;
    }
    if (result.code === "RATE_LIMITED" && result.retryAfterMs && result.retryAfterMs > 0) {
      setHeldUntil(Date.now() + result.retryAfterMs);
      setError(null); // the held-state alert below says it, with the time
      return;
    }
    setError(supportErrorMessage(result, "We couldn't save your rating. Please try again."));
  };

  const ratingMissing = touched && rating === null;

  return (
    <SupportDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !submitting) onDismiss();
        onOpenChange(next);
      }}
      title="Rate your agent"
      description={`Your ticket ${displayNumber} is ${closed ? "closed" : "resolved"}. How did we do? It takes a few seconds.`}
      busy={submitting}
      size="md"
      returnFocusTo={returnFocusTo}
      footer={
        <>
          {rateLaterEnabled ? (
            <SupportButton
              variant="outline"
              size="md"
              disabled={submitting}
              onClick={() => {
                onDismiss();
                onOpenChange(false);
              }}
            >
              Maybe later
            </SupportButton>
          ) : null}
          <SupportButton
            variant="primary"
            size="md"
            loading={submitting}
            // held, not disabled: a pressed button keeps keyboard focus (SupportButton `blocked`)
            blocked={heldUntil !== null}
            disabled={commentTooLong}
            aria-describedby={heldUntil !== null ? heldId : undefined}
            onClick={() => void submit()}
          >
            {submitting ? "Submitting…" : "Submit rating"}
          </SupportButton>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="flex flex-col gap-5"
      >
        {agentName ? (
          <div className="flex items-center gap-3 rounded-xl border border-support-divider bg-bgSecondary p-3 dark:border-darkBorder dark:bg-darkTertiaryBg">
            <UserAvatar user={agent} size={40} />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium leading-[22px] text-headingTextColor dark:text-darkTextPrimary">
                {agentName}
              </p>
              <p className="text-[13px] leading-[18px] text-subTextColor dark:text-darkTextSecondary">Support team · handled your ticket</p>
            </div>
          </div>
        ) : null}

        <fieldset className="flex flex-col gap-2">
          <legend id={labelId} className="mb-2 text-[14px] font-medium leading-5 text-headingTextColor dark:text-darkTextPrimary">
            {agentName ? `How would you rate ${agentName}'s help?` : "How would you rate the help you received?"}
          </legend>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <StarRating
              value={rating ?? 0}
              onChange={(value) => {
                setRating(value);
                setTouched(true);
              }}
              disabled={submitting}
              size={34}
              labelledBy={labelId}
              describedBy={ratingMissing ? ratingErrorId : undefined}
              invalid={ratingMissing}
            />
            <span
              aria-live="polite"
              className={cn(
                "text-[15px] font-medium leading-[22px]",
                rating ? "text-[#bb4d00] dark:text-[#ffd230]" : "text-support-muted-text dark:text-darkTextSecondary",
              )}
            >
              {rating ? RATING_GRADES[rating] : "Select 1–5 stars"}
            </span>
          </div>
          {ratingMissing ? (
            <p id={ratingErrorId} role="alert" className="text-[13px] leading-5 text-[#c10007] dark:text-[#ffa2a2]">
              Please select a rating.
            </p>
          ) : null}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend id={chipsLabelId} className="mb-2 text-[14px] font-medium leading-5 text-headingTextColor dark:text-darkTextPrimary">
            What went well? <span className="font-normal text-support-muted-text dark:text-darkTextSecondary">(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby={chipsLabelId}>
            {FEEDBACK_HIGHLIGHT_VALUES.map((value) => {
              const active = highlights.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  disabled={submitting || (!active && highlights.length >= SUPPORT_LIMITS.HIGHLIGHTS_MAX)}
                  onClick={() => toggleHighlight(value)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium leading-none outline-none transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-50", FOCUS_RING,
                    // selected = the chip as the rating card will show it (TD-06 tones)
                    active
                      ? HIGHLIGHT_TONE_CLASS[HIGHLIGHT_TONE[value]]
                      : "border-borderColor bg-white text-support-slate hover:border-support-border-hover hover:bg-bgSecondary dark:border-darkBorder dark:bg-transparent dark:text-darkTextPrimary",
                  )}
                >
                  {active ? <Check aria-hidden="true" className="size-3.5" /> : null}
                  {FEEDBACK_HIGHLIGHT_LABELS[value]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor={commentId} className="text-[14px] font-medium leading-5 text-headingTextColor dark:text-darkTextPrimary">
            Anything else? <span className="font-normal text-support-muted-text dark:text-darkTextSecondary">(optional)</span>
          </label>
          <textarea
            id={commentId}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={submitting}
            rows={3}
            placeholder="Tell us what helped or what we could do better"
            aria-describedby={commentHintId}
            aria-invalid={commentTooLong || undefined}
            className={cn(
              "block w-full resize-y rounded-lg border bg-white px-3.5 py-2.5 text-[14px] leading-[22px] text-headingTextColor outline-none transition-[border-color,box-shadow] placeholder:text-support-muted-text focus:border-primary focus:shadow-[0_0_0_3px_rgba(7,136,243,0.15)] disabled:opacity-60 dark:bg-darkPrimaryBg dark:text-darkTextPrimary",
              commentTooLong ? "border-[#fb2c36]" : "border-borderColor dark:border-darkBorder",
            )}
          />
          <p
            id={commentHintId}
            className={cn(
              "text-[12.5px] leading-[18px]",
              commentTooLong ? "text-[#c10007] dark:text-[#ffa2a2]" : "text-support-muted-text dark:text-darkTextSecondary",
            )}
          >
            {commentLength >= COMMENT_COUNTER_FROM || commentTooLong
              ? `${commentLength.toLocaleString("en-US")} / ${SUPPORT_LIMITS.COMMENT_MAX.toLocaleString("en-US")}${commentTooLong ? " — please shorten your comment" : ""}`
              : "Your agent and the support lead can read this."}
          </p>
        </div>

        {error ? (
          <SupportAlert role="alert" tone="error" className="py-2 text-[13.5px]">
            {error}
          </SupportAlert>
        ) : null}
        {heldUntil !== null ? (
          <SupportAlert id={heldId} role="alert" tone="error" className="py-2 text-[13.5px]">
            Too many attempts. You can send your rating again at {clockTime(heldUntil)}.
          </SupportAlert>
        ) : null}
      </form>
    </SupportDialog>
  );
};

export default FeedbackDialog;
