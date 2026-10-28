"use client";

import { useCallback, useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import { notifySupport } from "@/components/Support/primitives";
import { applyTicketUpdate } from "@/components/Support/list/listState";
import { toMs } from "@/lib/supportGuards";
import { useSupportSocket } from "@/socket/useSupportSocket";
import type { MessageDTO, TicketRequesterDetail, UserRef } from "@/types/support";
import { actorRef, applyStatus, localEvent } from "./ticketMerge";
import { firstName, statusAnnouncement } from "./ticketCopy";
import type { ThreadAction, ThreadState } from "./threadState";
import { findConversationRow } from "./Timeline";

/** The requester's own message as the socket delivered it (a lost send answer is settled with it). */
export interface OwnEcho {
  message: MessageDTO;
  receivedAt: number;
}

interface UseTicketRealtimeOptions {
  ticketId: number;
  /** epoch ms of the server render (the socket's first-connect catch-up, §9.4) */
  renderedAt: number | null;
  /** the page's full re-read (`GET /tickets/:id`) */
  refetch: () => Promise<void>;
  /** the ticket and thread as last rendered (handlers read them; they never re-subscribe) */
  ticketRef: RefObject<TicketRequesterDetail>;
  threadRef: RefObject<ThreadState>;
  /** the newest server state the page shows (epoch ms) — the page's reads and reply patches raise it too */
  statusAtRef: RefObject<number>;
  setTicket: Dispatch<SetStateAction<TicketRequesterDetail>>;
  dispatch: Dispatch<ThreadAction>;
  /** the page's polite live region */
  say: (text: string) => void;
  onOwnEcho: (echo: OwnEcho) => void;
  /** the rating popup must close (the ticket left resolved / closed, or was rated elsewhere) */
  closeRating: () => void;
}

const hasMessage = (state: ThreadState, id: number) =>
  state.pages.some((entry) => entry.item.type === "message" && entry.item.message.id === id) ||
  state.live.some((entry) => entry.item.type === "message" && entry.item.message.id === id);

/**
 * The ticket page's realtime (useSupportSocket with the ticket room): every event is applied IN
 * PLACE — the thread, the ticket fields, a synthesised timeline line — and each handler says
 * whether a refetch still has something to converge (step-9a review: the requester's own reply
 * echo, a redelivery and a status move caused by this tab's own reply need none).
 *
 * Also owns the bookkeeping the own-reply rule needs: which replies of this tab are in flight
 * (`sendStarted` / `sendSettled`); `statusAtRef` keeps an older status event from rolling the pill back.
 */
export function useTicketRealtime({
  ticketId,
  renderedAt,
  refetch,
  ticketRef,
  threadRef,
  statusAtRef,
  setTicket,
  dispatch,
  say,
  onOwnEcho,
  closeRating,
}: UseTicketRealtimeOptions) {
  /** this tab's replies in flight, and when the last one was answered (status-event refetch rule) */
  const ownSendsRef = useRef(0);
  const lastOwnSentAtRef = useRef(0);

  // Frames and observers of the "new reply" announcement, released on unmount.
  const framesRef = useRef(new Set<number>());
  const observersRef = useRef(new Set<IntersectionObserver>());
  useEffect(() => {
    const frames = framesRef.current;
    const observers = observersRef.current;
    return () => {
      frames.forEach((frame) => cancelAnimationFrame(frame));
      frames.clear();
      observers.forEach((observer) => observer.disconnect());
      observers.clear();
    };
  }, []);

  /**
   * A support reply arrived: a toast when the reader cannot see it (sonner's polite region reads it
   * out), the page's own live region when the row is on screen — visibility means nothing to a
   * screen-reader user. Asynchronous on purpose: a one-shot IntersectionObserver instead of
   * getBoundingClientRect (no forced layout of a long thread), the row found from the list's end.
   */
  const announceReply = useCallback(
    (messageId: number, name: string) => {
      const frame = requestAnimationFrame(() => {
        framesRef.current.delete(frame);
        const node = findConversationRow(`m:${messageId}`);
        const toast = () =>
          notifySupport.info(`New reply from ${name}`, {
            id: `support-reply-${ticketId}`,
            action: {
              label: "View",
              // looked up at click time: a refetch may have re-rendered the row in the paged list meanwhile
              onClick: () => findConversationRow(`m:${messageId}`, 5_000)?.scrollIntoView({ behavior: "smooth", block: "center" }),
            },
          });
        if (!node || document.visibilityState !== "visible" || typeof IntersectionObserver === "undefined") {
          toast();
          return;
        }
        const observer = new IntersectionObserver((records) => {
          observer.disconnect();
          observersRef.current.delete(observer);
          if (!records[records.length - 1]?.isIntersecting) toast();
          else say(`New reply from ${name}`);
        });
        observersRef.current.add(observer);
        observer.observe(node);
      });
      framesRef.current.add(frame);
    },
    [say, ticketId],
  );

  const { connected, emitRead, emitTyping } = useSupportSocket({
    ticketId,
    refetch,
    dataAt: renderedAt,
    // Each handler returns false when it applied the event exactly in place, so no refetch is
    // scheduled for it (step-9a review: every reply cost an extra full-detail read for its echo).
    onMessage: (event) => {
      if (event.kind === "note") return false;
      const known = hasMessage(threadRef.current, event.id);
      if (event.author.role === "requester") onOwnEcho({ message: event, receivedAt: Date.now() });
      dispatch({ type: "liveMessage", message: event, receivedAt: Date.now() });
      if (!known) {
        setTicket((prev) => ({
          ...prev,
          public_message_count: prev.public_message_count + 1,
          last_message_at: event.created_at,
          updated_at: toMs(event.created_at) > toMs(prev.updated_at) ? event.created_at : prev.updated_at,
          // a public agent reply meets the running reply target: the next one starts with the
          // requester's next message (the refetch brings it), so never show the met one meanwhile
          ...(event.author.role === "agent" ? { expected_reply_by: null } : {}),
        }));
        if (event.author.role === "agent") announceReply(event.id, event.author.name?.trim() || "Support");
      }
      // The requester's own reply (its HTTP answer already patched the ticket, or the pending
      // bubble is being confirmed) and a redelivery change nothing a refetch would converge.
      return !known && event.author.role !== "requester";
    },
    onStatusChanged: (event) => {
      const at = event.at ?? new Date().toISOString();
      if (toMs(at) < statusAtRef.current) return false; // older than what the page already shows
      if (toMs(at) === statusAtRef.current && ticketRef.current.status === event.to) return false; // already shown
      statusAtRef.current = toMs(at);
      if (ticketRef.current.status !== event.to) say(statusAnnouncement(event.to, firstName(ticketRef.current.agent?.name)));
      setTicket((prev) => applyStatus(prev, event.to, at, event.reopen_count));
      const reopened = (event.from === "resolved" || event.from === "closed") && event.to !== "closed" && event.to !== "resolved";
      // This tab's own reply moved the status (it often lands before the reply's HTTP answer, which
      // carries the authoritative ticket patch incl. the new reply target): nothing to re-read.
      // The default namespace says so with `trigger: requester_reply`. `/support` sends no trigger
      // and names the reply-driven move's actor `'system'` (seen live, step 9c), so there the rule is
      // the move a requester reply makes — into open / in_progress, by the system or by a requester
      // actor — while this tab's own reply is in flight or just answered. A staff move carries the
      // staff actor and still refetches.
      const replyShapedMove =
        event.trigger === undefined &&
        (event.to === "in_progress" || event.to === "open") &&
        (event.actor === "system" ||
          (typeof event.actor === "object" && event.actor !== null && event.actor.kind === "requester"));
      const byRequester = event.trigger === "requester_reply" || replyShapedMove;
      const ownReplyMove =
        byRequester && (ownSendsRef.current > 0 || Date.now() - lastOwnSentAtRef.current < 10_000);
      dispatch({
        type: "liveEvent",
        event: localEvent(
          reopened ? "TICKET_REOPENED" : "STATUS_CHANGED",
          { from: event.from, to: event.to, ...(event.trigger !== undefined ? { trigger: event.trigger } : {}) },
          at,
          actorRef(event.actor, ticketRef.current),
        ),
        receivedAt: Date.now(),
      });
      if (event.to !== "resolved" && event.to !== "closed") closeRating();
      return !ownReplyMove;
    },
    onAssigned: (event) => {
      const agent: UserRef | null = event.agent
        ? { id: event.agent.id, name: event.agent.name ?? "", image: event.agent.image ?? null }
        : null;
      setTicket((prev) => ({ ...prev, agent }));
      if (agent) {
        dispatch({
          type: "liveEvent",
          event: localEvent(
            "TICKET_ASSIGNED",
            { to: agent.id, reason: event.reason ?? null },
            event.assigned_at ?? new Date().toISOString(),
            { id: agent.id, name: agent.name, image: agent.image, exists: true },
          ),
          receivedAt: Date.now(),
        });
      }
    },
    // Today `ticket:feedback` reaches staff rooms only (backend realtime/support.events.ts);
    // applied anyway so a rating saved in another tab or a future requester fan-out shows
    // at once — the comment (not in the payload) arrives with the debounced refetch.
    onFeedback: (event) => {
      closeRating();
      setTicket((prev) =>
        prev.feedback
          ? prev
          : {
              ...prev,
              can_rate: false,
              rating: event.rating,
              feedback: {
                rating: event.rating,
                highlights: event.highlights ?? [],
                comment: null,
                created_at: new Date().toISOString(),
              },
            },
      );
    },
    onUpdated: (event) => {
      // The same rule as a list row (listState.applyTicketUpdate); the page holds no category list,
      // so a new category shows by its slug until the refetch brings its name, icon and colour.
      setTicket((prev) => {
        const next = applyTicketUpdate(prev, event, []);
        return toMs(event.updated_at) > toMs(next.updated_at) ? { ...next, updated_at: event.updated_at } : next;
      });
      dispatch({
        type: "liveEvent",
        event: localEvent("TICKET_UPDATED", event.changes, event.updated_at, actorRef(event.actor, ticketRef.current)),
        receivedAt: Date.now(),
      });
    },
  });

  const sendStarted = useCallback(() => {
    ownSendsRef.current += 1;
  }, []);
  const sendSettled = useCallback((sent: boolean) => {
    ownSendsRef.current = Math.max(0, ownSendsRef.current - 1);
    if (sent) lastOwnSentAtRef.current = Date.now();
  }, []);
  return { connected, emitRead, emitTyping, sendStarted, sendSettled };
}
