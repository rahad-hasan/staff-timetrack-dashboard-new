"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import type { TicketRequesterDetail } from "@/types/support";

const dismissalKey = (ticketId: number) => `support-feedback-dismissed:${ticketId}`;

const readDismissal = (ticketId: number): string | null => {
  try {
    return window.localStorage.getItem(dismissalKey(ticketId));
  } catch {
    return null;
  }
};

const writeDismissal = (ticketId: number, epoch: string) => {
  try {
    window.localStorage.setItem(dismissalKey(ticketId), epoch);
  } catch {
    // storage unavailable (private mode / blocked): the prompt may simply ask again next visit
  }
};

interface UseRatingPromptOptions {
  ticket: Pick<TicketRequesterDetail, "id" | "status" | "can_rate" | "feedback" | "reopen_count" | "rate_later_enabled">;
  /** the page root — "Rate this ticket" triggers are looked up inside it */
  rootRef: RefObject<HTMLElement | null>;
  /** the ticket title (tabIndex -1): the landing spot when no trigger is left */
  titleRef: RefObject<HTMLElement | null>;
}

/**
 * The rating popup's rules (Flow 3, REQ-U-23): it opens by itself once per resolution — the
 * epoch is `reopen_count`, which grows on every reopen — unless the requester dismissed it for
 * that epoch ("Maybe later", ×, Escape; remembered in localStorage). "Rate this ticket" stays
 * offered while the ticket is resolved/closed and unrated, when the owner allows rating later or
 * the popup was not dismissed yet.
 */
export function useRatingPrompt({ ticket, rootRef, titleRef }: UseRatingPromptOptions) {
  const ticketId = ticket.id;
  const [open, setOpen] = useState(false);
  const [dismissedEpoch, setDismissedEpoch] = useState<string | null>(null);
  const [dismissalLoaded, setDismissalLoaded] = useState(false);
  const epoch = String(ticket.reopen_count);

  // localStorage is read after mount (the server render cannot know it)
  useEffect(() => {
    setDismissedEpoch(readDismissal(ticketId));
    setDismissalLoaded(true);
  }, [ticketId]);

  const ratable = ticket.can_rate && ticket.feedback === null;
  useEffect(() => {
    if (!dismissalLoaded) return;
    if (!ratable || ticket.status !== "resolved") return;
    if (dismissedEpoch === epoch) return;
    setOpen(true);
  }, [dismissalLoaded, ratable, ticket.status, dismissedEpoch, epoch]);

  const openPrompt = useCallback(() => setOpen(true), []);
  const closePrompt = useCallback(() => setOpen(false), []);

  const dismiss = useCallback(() => {
    writeDismissal(ticketId, epoch);
    setDismissedEpoch(epoch);
  }, [ticketId, epoch]);

  const showRate = ratable && (ticket.rate_later_enabled || dismissedEpoch !== epoch);

  // Where focus lands when the popup closes and its opener is gone or never existed (it auto-opens on
  // a resolve, usually with nothing focused): the first visible "Rate this ticket" (header below lg,
  // the rating card at lg+) while rating is still offered, else the ticket title — never <body>,
  // which would restart keyboard users 12 shell tab stops before the page.
  const returnFocusTo = useCallback((): HTMLElement | null => {
    const triggers = rootRef.current?.querySelectorAll<HTMLElement>("[data-support-rate-trigger]") ?? [];
    const rate = Array.from(triggers).find((element) => element.getClientRects().length > 0);
    return rate ?? titleRef.current;
  }, [rootRef, titleRef]);

  return {
    /** the popup may show (the caller also requires `ratable`) */
    open: open && ratable,
    setOpen,
    openPrompt,
    closePrompt,
    dismiss,
    ratable,
    showRate,
    returnFocusTo,
  };
}
