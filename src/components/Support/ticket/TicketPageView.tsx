"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { notifySupport, useLatestRef, useLatestRequest } from "@/components/Support/primitives";
import { newTicketHref, supportApi, supportErrorMessage, type SupportFail } from "@/lib/support";
import { isImageAttachmentDTO } from "@/lib/supportAttachments";
import { toMs } from "@/lib/supportGuards";
import type { AttachmentDTO, FeedbackResult, PostMessageResult, TicketRequesterDetail } from "@/types/support";
import { CATEGORY_LABELS } from "@/types/support";
import { AttachmentUrlProvider } from "./attachmentUrls";
import { AgentCard, FilesCard, RatingCard } from "./AsideCards";
import { ConversationCard } from "./ConversationCard";
import { FeedbackDialog } from "./FeedbackDialog";
import { ImageLightbox, type LightboxImage } from "./ImageLightbox";
import type { OpenImageHandler } from "./MessageFiles";
import { ReplyComposer } from "./ReplyComposer";
import { StatusBanner } from "./StatusBanner";
import { TicketHeaderCard } from "./TicketHeaderCard";
import { TicketNotFound } from "./TicketNotFound";
import { findConversationRow, Timeline } from "./Timeline";
import { firstName, type EventContext } from "./ticketCopy";
import { applyPatch, mergeFresh } from "./ticketMerge";
import { initialThread, newestMessageId, presentationOrder, threadReducer, type PendingReply, type ThreadEntry } from "./threadState";
import { useRatingPrompt } from "./useRatingPrompt";
import { useReadReceipt } from "./useReadReceipt";
import { useTicketRealtime, type OwnEcho } from "./useTicketRealtime";

interface TicketPageViewProps {
  initial: TicketRequesterDetail;
  /** epoch ms of the server render (the socket's first-connect catch-up, §9.4) */
  renderedAt?: number;
  /**
   * `feedback` = the page was opened from a "Rate your agent" link (`?action=feedback`, the
   * feedback request / reminder mails): open the rating popup, or say why it can't be opened.
   */
  intent?: "feedback" | null;
}

/** Why a "Rate your agent" link can't open the popup — null when it can. */
const rateLinkRefusal = (ticket: TicketRequesterDetail): { title: string; description: string } | null => {
  if (ticket.feedback) {
    return { title: "You've already rated this ticket", description: "Thanks — your rating was sent to the support team." };
  }
  if (ticket.can_rate) return null;
  if (!ticket.feedback_enabled) {
    return { title: "Ratings are switched off", description: "The support team isn't collecting ratings right now." };
  }
  if (ticket.status !== "resolved" && ticket.status !== "closed") {
    return {
      title: "This ticket is open again",
      description: "You can rate it once the support team resolves it.",
    };
  }
  return { title: "This ticket can't be rated", description: "The rating window for this ticket has ended." };
};

/* ───────────────────────────── thread derivations ───────────────────────────── */

/** Newest message id among `entries` written by `role` (null when none). */
const newestOf = (entries: readonly ThreadEntry[], role?: "agent") => {
  let out: number | null = null;
  for (const entry of entries) {
    if (entry.item.type !== "message") continue;
    if (role && entry.item.message.author.role !== role) continue;
    if (out === null || entry.item.message.id > out) out = entry.item.message.id;
  }
  return out;
};
const maxOrNull = (a: number | null, b: number | null) => (a === null ? b : b === null ? a : Math.max(a, b));
/** Newest support message the requester has already seen (the server's read mark, §8.2 `seen_by_requester`). */
const newestSeenAgent = (entries: readonly ThreadEntry[]) => {
  let out: number | null = null;
  for (const entry of entries) {
    if (entry.item.type !== "message") continue;
    const message = entry.item.message;
    if (message.author.role !== "agent" || !message.seen_by_requester) continue;
    if (out === null || message.id > out) out = message.id;
  }
  return out;
};
const countMessages = (entries: readonly ThreadEntry[]) =>
  entries.reduce((count, entry) => count + (entry.item.type === "message" ? 1 : 0), 0);

/** Every image attachment of `entries`, freshest copy per file id. */
const collectImages = (entries: readonly ThreadEntry[], into = new Map<number, LightboxImage>()) => {
  for (const entry of entries) {
    if (entry.item.type !== "message") continue;
    for (const file of entry.item.message.files) {
      const known = into.get(file.id);
      if (isImageAttachmentDTO(file) && (!known || known.obtainedAt < entry.obtainedAt)) {
        into.set(file.id, { file, obtainedAt: entry.obtainedAt });
      }
    }
  }
  return into;
};

/* ───────────────────────────── the page ───────────────────────────── */

/**
 * `/support/tickets/[id]` — the requester's ticket page (plan.md §3.3; no
 * PNG of its own, built in the TD-01/TD-06 language with the user-portal
 * tokens). Owns the ticket and the thread (threadState.ts) and wires the
 * parts: realtime (useTicketRealtime), read receipts (useReadReceipt), the
 * rating popup (useRatingPrompt), the lightbox and the reopen-as-new hand-off.
 */
export default function TicketPageView({ initial, renderedAt, intent = null }: TicketPageViewProps) {
  const router = useRouter();
  const ticketId = initial.id;
  const [ticket, setTicket] = useState<TicketRequesterDetail>(initial);
  const [fetchedAt, setFetchedAt] = useState(() => Date.now());
  const [thread, dispatch] = useReducer(threadReducer, undefined, () =>
    initialThread(initial.timeline, initial.thread, Date.now()),
  );
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState<string | null>(null);
  const [lightboxFileId, setLightboxFileId] = useState<number | null>(null);
  const [openingNew, setOpeningNew] = useState(false);
  const [gone, setGone] = useState(false);
  const [ownEcho, setOwnEcho] = useState<OwnEcho | null>(null);
  /** the page's own polite live region (live replies + status changes, WCAG 4.1.3) */
  const [liveNote, setLiveNote] = useState({ text: "", n: 0 });
  const say = useCallback((text: string) => setLiveNote((prev) => ({ text, n: prev.n + 1 })), []);

  const latestRead = useLatestRequest();
  const olderRead = useLatestRequest();
  const ticketRef = useLatestRef(ticket);
  const threadRef = useLatestRef(thread);
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const rating = useRatingPrompt({ ticket, rootRef, titleRef });
  const { closePrompt: closeRating, openPrompt: openRating } = rating;

  // "Rate your agent" (mail / notification): handled once per page load, on the server-rendered
  // state. The popup opens even when an earlier "Maybe later" dismissed the automatic prompt — the
  // link is an explicit request. `action` then leaves the URL through the ROUTER, not
  // `history.replaceState`: Next keeps the page's search params in its own router tree and cache
  // (the history entry's `__PRIVATE_NEXTJS_INTERNALS_TREE`), so a native rewrite left
  // `?action=feedback` there — an in-app Back re-rendered the page with the intent (the popup
  // reopened over a "Maybe later", a rated ticket's toast came back) and a router refresh wrote it
  // back into the address bar (step-9c review). `router.replace` swaps the entry and the cached
  // segment for the plain URL; it costs one server render per mail-link visit, and this view stays
  // mounted (keyed by ticket id, the layout router's key ignores search params), so the popup the
  // link opened stays open.
  const rateLinkHandled = useRef(false);
  useEffect(() => {
    if (intent !== "feedback" || rateLinkHandled.current) return;
    rateLinkHandled.current = true;
    const url = new URL(window.location.href);
    url.searchParams.delete("action");
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
    const refusal = rateLinkRefusal(initial);
    if (refusal) notifySupport.info(refusal.title, { description: refusal.description, id: `support-rate-link-${initial.id}` });
    else openRating();
  }, [intent, initial, openRating, router]);

  /** the newest server state the page shows (epoch ms) — an older status event never rolls the pill back */
  const statusAtRef = useRef(toMs(initial.updated_at));

  /* ── data ── */

  const refetch = useCallback(async () => {
    const startedAt = Date.now();
    const result = await latestRead.run((signal) => supportApi.getTicket(ticketId, { signal }));
    if (!result.ok) {
      if (!result.aborted && (result.status === 404 || result.code === "TICKET_NOT_FOUND")) setGone(true);
      return;
    }
    const now = Date.now();
    setTicket((prev) => mergeFresh(prev, result.data));
    statusAtRef.current = Math.max(statusAtRef.current, toMs(result.data.updated_at));
    setFetchedAt(now);
    dispatch({
      type: "latest",
      timeline: result.data.timeline,
      thread: result.data.thread,
      obtainedAt: now,
      startedAt,
    });
  }, [latestRead, ticketId]);

  const loadOlder = useCallback(async () => {
    const before = threadRef.current.nextBefore;
    if (!before) return;
    setLoadingOlder(true);
    setOlderError(null);
    const result = await olderRead.run((signal) => supportApi.getTicket(ticketId, { before, signal }));
    if (result.ok) {
      dispatch({ type: "older", timeline: result.data.timeline, thread: result.data.thread, obtainedAt: Date.now() });
      setLoadingOlder(false);
      return;
    }
    if (result.aborted) return;
    setLoadingOlder(false);
    setOlderError(supportErrorMessage(result, "We couldn't load the earlier messages."));
  }, [olderRead, threadRef, ticketId]);
  const onLoadOlder = useCallback(() => void loadOlder(), [loadOlder]);
  const refetchNow = useCallback(() => void refetch(), [refetch]);

  /* ── realtime ── */

  const realtime = useTicketRealtime({
    ticketId,
    renderedAt: renderedAt ?? null,
    refetch,
    ticketRef,
    threadRef,
    statusAtRef,
    setTicket,
    dispatch,
    say,
    onOwnEcho: setOwnEcho,
    closeRating,
  });
  const { connected, emitRead, emitTyping, sendStarted, sendSettled } = realtime;
  // read from onSent (an async continuation of the composer's submit) — the value when it settles
  const connectedRef = useLatestRef(connected);

  /* ── reply ── */

  const scrollFramesRef = useRef(0);
  useEffect(() => () => cancelAnimationFrame(scrollFramesRef.current), []);
  const onOptimistic = useCallback(
    (pending: PendingReply) => {
      sendStarted();
      dispatch({ type: "pendingStart", pending });
      cancelAnimationFrame(scrollFramesRef.current);
      scrollFramesRef.current = requestAnimationFrame(() => {
        findConversationRow("pending", 8)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    },
    [sendStarted],
  );

  const onSent = useCallback(
    (tempId: string, result: PostMessageResult) => {
      sendSettled(true);
      dispatch({ type: "pendingDone", tempId, message: result.message, receivedAt: Date.now() });
      const patch = result.ticket;
      setTicket((prev) => {
        if (toMs(patch.updated_at) < toMs(prev.updated_at)) {
          return { ...prev, public_message_count: Math.max(prev.public_message_count, patch.public_message_count ?? 0) };
        }
        statusAtRef.current = Math.max(statusAtRef.current, toMs(patch.updated_at));
        return applyPatch(prev, patch);
      });
      notifySupport.success(result.toast.title || "Reply sent", {
        description: result.toast.body ?? undefined,
        id: `support-reply-sent-${tempId}`,
      });
      // Without realtime nothing reports a change that raced this reply (e.g. a resolve the API
      // applied just after it, while this answer still carried the older state): reconcile once.
      if (!connectedRef.current) void refetch();
    },
    [connectedRef, refetch, sendSettled],
  );

  const onFailed = useCallback(
    (tempId: string, failure: SupportFail) => {
      sendSettled(false);
      dispatch({ type: "pendingFail", tempId });
      if (failure.code === "TICKET_CLOSED" && ticketRef.current.status === "closed") {
        // The real reply-vs-close race: the close event landed while the reply was in flight, so
        // the composer is replaced by the unsent draft (no error strip, no live region of its own)
        // — say it here. The page already shows Closed: no refetch (step-9c review).
        say("Your reply wasn't sent because the ticket was closed. Your text is kept below.");
        return;
      }
      // still open on screen: the composer's role=alert strip says it; the refetch brings the close
      if (failure.code === "TICKET_CLOSED" || failure.code === "TICKET_NOT_FOUND") void refetch();
    },
    [refetch, say, sendSettled, ticketRef],
  );

  /* ── rating ── */

  const onRated = useCallback(
    (feedback: FeedbackResult) => {
      setTicket((prev) => ({
        ...prev,
        feedback: {
          rating: feedback.rating,
          highlights: feedback.highlights ?? [],
          comment: feedback.comment ?? null,
          created_at: feedback.created_at,
        },
        rating: feedback.rating,
        can_rate: false,
      }));
      notifySupport.success("Thanks for your feedback!", { description: "Your rating was sent to the support team." });
      void refetch();
    },
    [refetch],
  );

  const onRatingRejected = useCallback(
    (failure: SupportFail) => {
      notifySupport.info(supportErrorMessage(failure));
      void refetch();
    },
    [refetch],
  );

  /* ── reopen as new ── */

  const openNew = useCallback(async () => {
    setOpeningNew(true);
    const result = await supportApi.reopenAsNew(ticketId);
    if (result.ok) {
      router.push(newTicketHref(result.data));
      return; // the button keeps spinning until the create page takes over
    }
    setOpeningNew(false);
    // 409 INVALID_STATE: the ticket is not closed any more (the owner reopened it meanwhile) — the
    // generic INVALID_STATE sentence is the rating one, so this answer has its own
    notifySupport.error("Couldn't start a new ticket", {
      description:
        result.code === "INVALID_STATE"
          ? "This ticket isn't closed any more — you can reply on it instead."
          : supportErrorMessage(result),
    });
    void refetch();
  }, [refetch, router, ticketId]);
  const openNewNow = useCallback(() => void openNew(), [openNew]);

  /* ── derived view data ── */

  // Two parts, memoised apart: the server pages change on a refetch / older page, the live tail on
  // every socket event — so an event costs O(live), not O(thread) (5 000 loaded rows stay untouched).
  const pagedEntries = useMemo(() => presentationOrder(thread.pages), [thread.pages]);
  const pagedKeys = useMemo(() => new Set(thread.pages.map((entry) => entry.key)), [thread.pages]);
  const liveEntries = useMemo(
    () => presentationOrder(thread.live.filter((entry) => !pagedKeys.has(entry.key))),
    [thread.live, pagedKeys],
  );
  const pagedStats = useMemo(
    () => ({ newest: newestMessageId(pagedEntries), newestAgent: newestOf(pagedEntries, "agent"), messages: countMessages(pagedEntries) }),
    [pagedEntries],
  );
  const newestId = maxOrNull(pagedStats.newest, newestOf(liveEntries));
  const newestAgentId = maxOrNull(pagedStats.newestAgent, newestOf(liveEntries, "agent"));
  const loadedMessages = pagedStats.messages + countMessages(liveEntries);
  const hiddenCount = Math.max(0, ticket.public_message_count - loadedMessages);

  const requesterName = ticket.requester_name?.trim() || "You";
  const opening = useMemo(
    () => ({
      createdAt: ticket.created_at,
      source: ticket.source,
      requesterName,
      description: ticket.description,
      files: ticket.files.filter((file) => file.message_id === null || file.message_id === undefined),
      obtainedAt: fetchedAt,
    }),
    [ticket.created_at, ticket.source, requesterName, ticket.description, ticket.files, fetchedAt],
  );

  // Keyed on primitives, not object identity: every refetch brings new `agent` / `category_ref`
  // objects, and a new context would re-render every timeline row (thousands on a long thread).
  const agentId = ticket.agent?.id ?? null;
  const agentName = ticket.agent?.name ?? null;
  const categorySlug = ticket.category_ref?.slug ?? null;
  const categoryRefName = ticket.category_ref?.name ?? null;
  const eventContext = useMemo<EventContext>(
    () => ({
      requesterId: ticket.requester_id,
      agent: agentId !== null ? { id: agentId, name: agentName ?? "" } : null,
      categoryName: (slug: string) =>
        categorySlug === slug && categoryRefName ? categoryRefName : (CATEGORY_LABELS[slug] ?? slug),
    }),
    [ticket.requester_id, agentId, agentName, categorySlug, categoryRefName],
  );

  const hasUnreadFromSupport = useCallback(
    (lastMarked: number) => newestAgentId !== null && newestAgentId > lastMarked,
    [newestAgentId],
  );
  // the server's read mark: an open of an already-read ticket posts nothing (step-9a review)
  const seenUpTo = useMemo(() => newestSeenAgent(pagedEntries), [pagedEntries]);
  const newestRef = useReadReceipt({
    ticketId,
    newestId,
    hasUnreadFromSupport,
    enabled: !gone,
    seenUpTo,
    sendViaSocket: emitRead,
  });
  const newestKey = newestId !== null ? `m:${newestId}` : null;

  // Every image the page can show, oldest first, for the lightbox's ←/→ (paged images memoised apart).
  const pagedImages = useMemo(() => collectImages(pagedEntries), [pagedEntries]);
  const gallery = useMemo<LightboxImage[]>(() => {
    const byId = new Map<number, LightboxImage>();
    ticket.files.forEach((file) => {
      if (isImageAttachmentDTO(file)) byId.set(file.id, { file, obtainedAt: fetchedAt });
    });
    pagedImages.forEach((image, id) => {
      const known = byId.get(id);
      if (!known || known.obtainedAt < image.obtainedAt) byId.set(id, image);
    });
    collectImages(liveEntries, byId);
    return [...byId.values()].sort((a, b) => toMs(a.file.created_at) - toMs(b.file.created_at) || a.file.id - b.file.id);
  }, [ticket.files, pagedImages, liveEntries, fetchedAt]);

  // The open image is tracked by file id, so the gallery can change underneath the preview
  // (a new image arrives, an attachment is removed) without it jumping to another picture.
  const openImage = useCallback<OpenImageHandler>((file: AttachmentDTO) => {
    setLightboxFileId(file.id);
  }, []);
  const lightboxIndex = useMemo(() => {
    if (lightboxFileId === null) return null;
    const index = gallery.findIndex((image) => image.file.id === lightboxFileId);
    return index === -1 ? null : index;
  }, [gallery, lightboxFileId]);
  const onLightboxIndexChange = useCallback(
    (index: number | null) => setLightboxFileId(index === null ? null : (gallery[index]?.file.id ?? null)),
    [gallery],
  );

  if (gone) {
    return <TicketNotFound reason="gone" />;
  }

  const agentFirst = firstName(ticket.agent?.name);
  const closed = ticket.status === "closed";

  return (
    <AttachmentUrlProvider onUnsignable={refetchNow}>
      <div ref={rootRef} className="flex w-full min-w-0 flex-col gap-4">
        <TicketHeaderCard
          ticket={ticket}
          titleRef={titleRef}
          showRate={rating.showRate}
          onRate={rating.openPrompt}
          onOpenNew={closed ? openNewNow : null}
          openingNew={openingNew}
        />

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_376px] lg:items-start">
          <ConversationCard messageCount={ticket.public_message_count} connected={connected}>
            <Timeline
              opening={opening}
              pagedEntries={pagedEntries}
              liveEntries={liveEntries}
              pending={thread.pending}
              hiddenCount={hiddenCount}
              hasMore={thread.hasMore}
              loadingOlder={loadingOlder}
              olderError={olderError}
              onLoadOlder={onLoadOlder}
              eventContext={eventContext}
              onOpenImage={openImage}
              newestRef={newestRef}
              newestKey={newestKey}
            />
            {/* TD-01 / TD-06: the state banner and the composer follow the thread 24px below it
                (no divider), 12px apart, inside the card's 24px padding */}
            <div className="mt-6 flex flex-col gap-3">
              <StatusBanner
                status={ticket.status}
                agentFirstName={agentFirst}
                closedReason={ticket.closed_reason}
                onOpenNew={openNewNow}
                openingNew={openingNew}
              />
              <ReplyComposer
                ticketId={ticketId}
                canReply={ticket.can_reply}
                closed={closed}
                agentFirstName={agentFirst}
                onOptimistic={onOptimistic}
                onSent={onSent}
                onFailed={onFailed}
                ownEcho={ownEcho}
                onTyping={emitTyping}
              />
            </div>
          </ConversationCard>

          {/* TD-06 puts the rating card first in the column once the ticket is resolved */}
          <aside aria-label="Ticket details" className="flex min-w-0 flex-col gap-4 md:max-lg:grid md:max-lg:grid-cols-2 md:max-lg:items-start">
            <RatingCard
              feedback={ticket.feedback}
              agentName={ticket.agent?.name?.trim() || null}
              canRate={rating.showRate}
              onRate={rating.openPrompt}
            />
            <AgentCard agent={ticket.agent} />
            <FilesCard files={ticket.files} obtainedAt={fetchedAt} onOpenImage={openImage} />
          </aside>
        </div>
      </div>

      <FeedbackDialog
        // only while the ticket can still be rated: a reopen (a reply racing the resolve) or a
        // rating saved elsewhere closes it without recording a "Maybe later" dismissal
        open={rating.open}
        onOpenChange={rating.setOpen}
        ticketId={ticketId}
        displayNumber={ticket.display_number}
        closed={closed}
        agent={ticket.agent}
        rateLaterEnabled={ticket.rate_later_enabled}
        onDismiss={rating.dismiss}
        onRated={onRated}
        onRejected={onRatingRejected}
        returnFocusTo={rating.returnFocusTo}
      />
      <ImageLightbox images={gallery} index={lightboxIndex} onIndexChange={onLightboxIndexChange} />
      {/* A zero-width space alternates on repeats, so the same sentence is announced again. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true" data-support-live-note>
        {liveNote.text}
        {liveNote.n % 2 === 1 ? "​" : ""}
      </p>
    </AttachmentUrlProvider>
  );
}
