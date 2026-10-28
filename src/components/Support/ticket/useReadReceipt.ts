"use client";

import { useCallback, useEffect, useRef } from "react";
import { useLatestRef } from "@/components/Support/primitives/useLatestRef";
import { supportApi } from "@/lib/support";

/** At most one read mark per this window (the API also throttles, §8.3 "throttled"). */
const MIN_INTERVAL_MS = 10_000;

interface UseReadReceiptOptions {
  ticketId: number;
  /** newest message id of the loaded thread */
  newestId: number | null;
  /** an agent message newer than what was last marked exists — something to report */
  hasUnreadFromSupport: (lastMarkedId: number) => boolean;
  enabled: boolean;
  /**
   * newest support message the server already counts as read (`seen_by_requester`): marks up to it
   * are never re-sent, so opening an already-read ticket posts nothing
   */
  seenUpTo?: number | null;
  /**
   * `ticket:read` over the `/support` socket (Redis + worker flush, no Postgres write on the request
   * path); resolves false when it could not be sent that way → the HTTP endpoint is used
   */
  sendViaSocket?: (lastReadMessageId: number) => Promise<boolean>;
}

/**
 * Read receipts (`POST /tickets/:id/read { last_read_message_id }`, the
 * agent's "✓✓ Seen" in TD-01): reported when the newest message is at least
 * 60 % on screen while the tab is visible, only when the id grows past the
 * last reported one and only when support wrote something since, at most
 * once per 10 s (leading call, then one trailing call for whatever arrived
 * meanwhile). Returns the callback ref for the newest message's element.
 * Observer, timer and listener are released on unmount / element change.
 *
 * Starts from the server's read mark (`seenUpTo`), so a reload of a read
 * ticket costs no request (step-9a review: every open re-posted the mark, a
 * 4-query transaction). Sent over the `/support` socket when that is live,
 * else (or when the socket path fails) over HTTP.
 */
export function useReadReceipt({
  ticketId,
  newestId,
  hasUnreadFromSupport,
  enabled,
  seenUpTo = null,
  sendViaSocket,
}: UseReadReceiptOptions) {
  const lastMarkedRef = useRef(seenUpTo ?? 0);
  const lastSentAtRef = useRef(0);
  const visibleRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useLatestRef({ ticketId, newestId, hasUnreadFromSupport, enabled, sendViaSocket });
  const observerRef = useRef<IntersectionObserver | null>(null);

  // a later read (refetch / older page) may carry a newer server mark: never report below it
  useEffect(() => {
    if (seenUpTo !== null && seenUpTo > lastMarkedRef.current) lastMarkedRef.current = seenUpTo;
  }, [seenUpTo]);

  const send = useCallback(() => {
    const { ticketId: id, newestId: target, hasUnreadFromSupport: unread, enabled: on, sendViaSocket: viaSocket } =
      latestRef.current;
    if (!on || target === null || target <= lastMarkedRef.current) return;
    if (!unread(lastMarkedRef.current)) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (!visibleRef.current) return;
    const wait = lastSentAtRef.current + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) {
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          send();
        }, wait);
      }
      return;
    }
    lastSentAtRef.current = Date.now();
    const previous = lastMarkedRef.current;
    lastMarkedRef.current = target;
    const overHttp = () =>
      supportApi.markRead(id, { last_read_message_id: target }).then((result) => {
        // a refused mark (e.g. a just-removed message) may be retried with the next id
        if (!result.ok && !result.aborted && lastMarkedRef.current === target) lastMarkedRef.current = previous;
      });
    if (!viaSocket) {
      void overHttp();
      return;
    }
    void viaSocket(target).then((sent) => {
      if (!sent) void overHttp();
    });
  }, [latestRef]);

  // New newest message (socket / own reply / refetch): re-evaluate.
  useEffect(() => {
    send();
  }, [newestId, send]);

  useEffect(() => {
    const onVisibility = () => send();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [send]);

  /** callback ref for the newest message row */
  const observe = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      visibleRef.current = false;
      if (!node || typeof IntersectionObserver === "undefined") return;
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          // ≥ 60 % of the row, or half the viewport for a row taller than the screen
          const viewport = entry?.rootBounds?.height ?? window.innerHeight;
          visibleRef.current = Boolean(
            entry?.isIntersecting &&
              (entry.intersectionRatio >= 0.6 || entry.intersectionRect.height >= viewport * 0.5),
          );
          if (visibleRef.current) send();
        },
        { threshold: [0, 0.25, 0.5, 0.6, 1] },
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [send],
  );

  return observe;
}
