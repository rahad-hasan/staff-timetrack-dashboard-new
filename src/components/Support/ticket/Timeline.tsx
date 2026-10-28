"use client";

import { Fragment, memo, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountPill, SupportButton } from "@/components/Support/primitives";
import { formatDaySeparator } from "@/lib/supportFormat";
import { formatFileSize } from "@/lib/supportAttachments";
import type { AttachmentDTO, TicketSource } from "@/types/support";
import { BubbleFrame, MessageBubble } from "./MessageBubble";
import { EventLine } from "./EventLine";
import type { OpenImageHandler } from "./MessageFiles";
import { describeEvent, SOURCE_PHRASE, type EventContext, type EventLineCopy } from "./ticketCopy";
import type { PendingReply, ThreadEntry } from "./threadState";

/**
 * The conversation as one ordered list on a vertical rail (TD-01): a day
 * pill whenever the calendar day changes (and right after the "earlier
 * messages" gap), system lines and message cards. The description is the
 * first message (it is a ticket column, not a timeline item, §5.2), so the
 * opening line and its card are drawn here from the ticket row and the
 * server's TICKET_CREATED line is skipped.
 *
 * The rows come in two memoised lists — the server pages (older pages and
 * the latest page) and the live tail (socket messages / synthesised lines
 * not yet confirmed by a refetch) — so a live event re-renders only the
 * tail, never the thousands of loaded rows above it (React would otherwise
 * re-create and reconcile every row element per event). Rows are keyed by
 * message/event id; `content-visibility: auto` keeps long threads cheap to
 * lay out and paint.
 */

interface TimelineProps {
  opening: {
    createdAt: string;
    source: TicketSource;
    requesterName: string;
    description: string;
    files: readonly AttachmentDTO[];
    obtainedAt: number;
  };
  /** server-confirmed rows (older pages + latest page), presentation order */
  pagedEntries: readonly ThreadEntry[];
  /** live tail not confirmed by a page yet, presentation order */
  liveEntries: readonly ThreadEntry[];
  pending: PendingReply | null;
  hiddenCount: number;
  hasMore: boolean;
  loadingOlder: boolean;
  olderError: string | null;
  onLoadOlder: () => void;
  eventContext: EventContext;
  onOpenImage: OpenImageHandler;
  /** callback ref for the newest message row (read receipts) */
  newestRef: (node: HTMLElement | null) => void;
  newestKey: string | null;
}

/**
 * TD-01 timeline geometry (measured at 2×): 36px avatar column, content 14px
 * to its right, rows 18px apart, event rows 36px tall, day pill 24px / 12px.
 */
const DayPill = ({ at, now }: { at: string; now: Date }) => (
  <div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-3 sm:gap-3.5" role="presentation">
    <span aria-hidden="true" />
    <div className="flex items-center gap-3">
      <CountPill className="shrink-0 font-medium">
        <time dateTime={at} suppressHydrationWarning>
          {formatDaySeparator(at, now)}
        </time>
      </CountPill>
      <span aria-hidden="true" className="h-px flex-1 bg-support-divider dark:bg-darkBorder" />
    </div>
  </div>
);

const Row = memo(function Row({
  entry,
  context,
  requesterName,
  onOpenImage,
}: {
  entry: ThreadEntry;
  context: EventContext;
  requesterName: string;
  onOpenImage: OpenImageHandler;
}) {
  if (entry.item.type === "message") {
    const message = entry.item.message;
    if (message.kind === "note") return null;
    return (
      <MessageBubble
        message={message}
        requesterName={requesterName}
        obtainedAt={entry.obtainedAt}
        onOpenImage={onOpenImage}
      />
    );
  }
  const copy = describeEvent(entry.item.event, context);
  if (!copy) return null;
  return <EventLine copy={copy} at={entry.item.at} />;
});

const rowClass = "[content-visibility:auto] [contain-intrinsic-size:auto_96px]";

/** DOM id of the conversation list (lookups walk back from its end instead of querying the document). */
export const CONVERSATION_LIST_ID = "ticket-conversation";

/**
 * Local calendar day of an API timestamp, for "new day → pill" comparisons only. Native Date
 * instead of date-fns parseISO + format: a long thread computes thousands of these per render.
 */
const localDay = (iso: string): string => {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "";
  const date = new Date(time);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

/** The row element of `key`, found by walking back from the end of the list (new rows sit at the end). */
export const findConversationRow = (key: string, maxSteps = 400): HTMLElement | null => {
  let node = document.getElementById(CONVERSATION_LIST_ID)?.lastElementChild ?? null;
  for (let steps = 0; node && steps < maxSteps; steps += 1) {
    if (node.getAttribute("data-entry") === key) return node as HTMLElement;
    node = node.previousElementSibling;
  }
  return null;
};

/** Rows that render something (unknown / staff-only events are dropped up front so day pills never sit above an empty day). */
const renderable = (entry: ThreadEntry, context: EventContext) =>
  entry.item.type === "message" ? entry.item.message.kind !== "note" : describeEvent(entry.item.event, context) !== null;

interface RowListProps {
  rows: readonly ThreadEntry[];
  /** day of the row right above this list — a pill is drawn when the first row starts another day */
  startDay: string;
  /** a pill above the first row even on the same day (right after the "earlier messages" gap) */
  pillFirst: boolean;
  now: Date;
  context: EventContext;
  requesterName: string;
  onOpenImage: OpenImageHandler;
}

const RowList = memo(function RowList({
  rows,
  startDay,
  pillFirst,
  now,
  context,
  requesterName,
  onOpenImage,
}: RowListProps) {
  let previousDay = startDay;
  return (
    <>
      {rows.map((entry, index) => {
        const day = localDay(entry.item.at);
        const showDay = day !== previousDay || (pillFirst && index === 0);
        previousDay = day;
        return (
          <Fragment key={entry.key}>
            {showDay ? (
              <li className={rowClass}>
                <DayPill at={entry.item.at} now={now} />
              </li>
            ) : null}
            <li data-entry={entry.key} className={rowClass}>
              <Row entry={entry} context={context} requesterName={requesterName} onOpenImage={onOpenImage} />
            </li>
          </Fragment>
        );
      })}
    </>
  );
});

/** "Today" / "Yesterday" stay right when the page is left open past midnight (one timer per day). */
const useToday = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const next = new Date(now);
    next.setHours(24, 0, 1, 0);
    const timer = setTimeout(() => setNow(new Date()), Math.max(1_000, next.getTime() - Date.now()));
    return () => clearTimeout(timer);
  }, [now]);
  return now;
};

export const Timeline = ({
  opening,
  pagedEntries,
  liveEntries,
  pending,
  hiddenCount,
  hasMore,
  loadingOlder,
  olderError,
  onLoadOlder,
  eventContext,
  onOpenImage,
  newestRef,
  newestKey,
}: TimelineProps) => {
  const now = useToday();
  const olderErrorId = useId();
  const openingLine = useMemo<EventLineCopy>(
    () => ({ tone: "created", segments: [{ kind: "text", text: `You opened this ticket ${SOURCE_PHRASE[opening.source]}` }] }),
    [opening.source],
  );

  const pagedRows = useMemo(() => pagedEntries.filter((entry) => renderable(entry, eventContext)), [pagedEntries, eventContext]);
  const liveRows = useMemo(() => liveEntries.filter((entry) => renderable(entry, eventContext)), [liveEntries, eventContext]);

  const openingDay = localDay(opening.createdAt);
  const pagedLastDay = pagedRows.length > 0 ? localDay(pagedRows[pagedRows.length - 1].item.at) : openingDay;
  const lastDay = liveRows.length > 0 ? localDay(liveRows[liveRows.length - 1].item.at) : pagedLastDay;

  // The read-receipt observer watches the newest message row. It is attached here, by walking back
  // from the end of the list, so neither row list re-renders when the newest message changes.
  // `pagedRows` / `liveRows` are triggers, not inputs: a refetch can move the newest row from the
  // live tail into the paged list (same key, a new element) without changing `newestKey`.
  const observed = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const node = newestKey ? findConversationRow(newestKey) : null;
    if (node === observed.current) return;
    observed.current = node;
    newestRef(node);
  }, [newestKey, newestRef, pagedRows, liveRows]);

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 left-[17.5px] top-3 w-px bg-[#e5e7eb] dark:bg-darkBorder"
      />
      <ol id={CONVERSATION_LIST_ID} className="relative flex flex-col gap-[18px]" aria-label="Conversation">
        <li>
          <DayPill at={opening.createdAt} now={now} />
        </li>
        <li>
          <EventLine copy={openingLine} at={opening.createdAt} />
        </li>
        <li>
          <BubbleFrame
            role="requester"
            name={opening.requesterName}
            createdAt={opening.createdAt}
            body={opening.description}
            files={opening.files}
            obtainedAt={opening.obtainedAt}
            onOpenImage={onOpenImage}
            label="Original request"
          />
        </li>

        {hasMore ? (
          <li className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 sm:gap-3.5">
            <span aria-hidden="true" />
            <div className="flex flex-col items-start gap-2">
              <SupportButton
                variant="outline"
                size="sm"
                icon={olderError ? <RotateCw /> : <ChevronUp />}
                loading={loadingOlder}
                onClick={onLoadOlder}
                aria-describedby={olderError ? olderErrorId : undefined}
              >
                {olderError
                  ? "Try again"
                  : hiddenCount > 0
                    ? `Show ${hiddenCount.toLocaleString("en-US")} earlier ${hiddenCount === 1 ? "message" : "messages"}`
                    : "Show earlier messages"}
              </SupportButton>
              {olderError ? (
                <p id={olderErrorId} role="alert" className="text-[13px] leading-5 text-[#c10007] dark:text-[#ffa2a2]">
                  {olderError}
                </p>
              ) : null}
            </div>
          </li>
        ) : null}

        <RowList
          rows={pagedRows}
          startDay={openingDay}
          pillFirst={hasMore}
          now={now}
          context={eventContext}
          requesterName={opening.requesterName}
          onOpenImage={onOpenImage}
        />
        <RowList
          rows={liveRows}
          startDay={pagedLastDay}
          pillFirst={hasMore && pagedRows.length === 0}
          now={now}
          context={eventContext}
          requesterName={opening.requesterName}
          onOpenImage={onOpenImage}
        />

        {pending ? (
          <li data-entry="pending">
            {localDay(pending.createdAt) !== lastDay ? <DayPill at={pending.createdAt} now={now} /> : null}
            <BubbleFrame
              role="requester"
              name={opening.requesterName}
              createdAt={pending.createdAt}
              body={pending.body}
              obtainedAt={Date.now()}
              sending
              localFiles={
                pending.files.length > 0 ? (
                  <ul className={cn("flex flex-wrap gap-2", pending.body ? "mt-3" : "mt-2")} aria-label="Attachments being sent">
                    {pending.files.map((file) => (
                      <li
                        key={file.localId}
                        className="flex h-9 max-w-[240px] items-center gap-2 rounded-lg border border-borderColor bg-white px-2.5 text-[13px] text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextSecondary"
                      >
                        {file.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={file.previewUrl} alt="" className="size-6 rounded object-cover" />
                        ) : null}
                        <span className="truncate">{file.name}</span>
                        <span className="shrink-0 text-support-muted-text">{formatFileSize(file.size)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null
              }
            />
          </li>
        ) : null}
      </ol>
    </div>
  );
};

export default Timeline;
