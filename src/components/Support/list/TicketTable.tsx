"use client";

import { memo, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ticketHref } from "@/lib/support";
import { pageRange, ticketsWord } from "@/lib/supportFormat";
import type { TicketRequesterSummary } from "@/types/support";
import {
  Assignee,
  CategoryTile,
  FOCUS_RING,
  PriorityBadge,
  RatingStars,
  RelativeTime,
  Skeleton,
  StatusPill,
  resolveCategory,
} from "@/components/Support/primitives";
import { LIST_PAGE_SIZE, MAX_REACHABLE_PAGE, reachablePages, type ListPage } from "./listState";
import { TicketPager } from "./TicketPager";

const numberFormat = new Intl.NumberFormat("en-US");
export const formatCount = (value: number) => numberFormat.format(value);

/**
 * Column widths as CSS variables (one place for the table, its skeleton
 * rows and the header). ≥ 1140px content (1440 drawn): PRIORITY 115,
 * STATUS 165, ASSIGNED 180, REPLIES 81, RATING 79, action 62 — the measured
 * `TICKET_TABLE_COLUMNS`; 960–1139 (a 1280 laptop): the same grid tightened
 * so TICKET keeps ≥ 340px; below 960 the table becomes a card list.
 */
const COLUMN_VARS = cn(
  "[--c-pri:100px] [--c-sta:150px] [--c-asg:160px] [--c-rep:70px] [--c-rat:79px] [--c-act:56px]",
  "@min-[1140px]/list:[--c-pri:115px] @min-[1140px]/list:[--c-sta:165px] @min-[1140px]/list:[--c-asg:180px] @min-[1140px]/list:[--c-rep:81px] @min-[1140px]/list:[--c-act:62px]",
);

const COLS = ["var(--c-pri)", "var(--c-sta)", "var(--c-asg)", "var(--c-rep)", "var(--c-rat)", "var(--c-act)"];

const TH =
  "h-10 border-b border-support-divider bg-bgSecondary p-0 pb-[1.5px] text-left align-middle text-[11.5px] font-medium uppercase leading-4 tracking-[0.06em] text-support-muted-text dark:border-darkBorder dark:bg-darkTertiaryBg dark:text-darkTextSecondary";

const TD = "h-[77px] border-b border-support-divider p-0 align-middle dark:border-darkBorder";

/** Cell content as a flex box: no inline line box (strut) to push glyphs off the row's centre. */
const CELL = "flex min-w-0 items-center";

const CARD =
  "relative overflow-hidden rounded-2xl border border-borderColor bg-white dark:border-darkBorder dark:bg-darkSecondaryBg";

const MetaSeparator = () => (
  <span aria-hidden="true" className="size-[3px] shrink-0 rounded-full bg-[#b8bebd] dark:bg-darkTextSecondary" />
);

/** "TKT-000007 • Timer issue • 2 hours ago" (12.5/18; number 500 in the AA brand twin #066fc6 — drawn #0788f3 is 3.6:1 —, category #505553, time AA-grey). */
const MetaLine = ({ row, wrap = false }: { row: TicketRequesterSummary; wrap?: boolean }) => (
  <p
    className={cn(
      "flex min-w-0 items-center gap-x-2 text-[12.5px] leading-[18px]",
      wrap && "flex-wrap gap-y-0.5",
    )}
  >
    <span className="shrink-0 font-medium text-support-primary-text dark:text-support-primary-text-dark">{row.display_number}</span>
    <MetaSeparator />
    <span className={cn("min-w-0 text-subTextColor dark:text-darkTextSecondary", !wrap && "truncate")}>
      {resolveCategory(row).name}
    </span>
    <MetaSeparator />
    <RelativeTime value={row.created_at} className="shrink-0 whitespace-nowrap text-support-muted-text dark:text-darkTextSecondary" />
  </p>
);

const Replies = ({ count }: { count: number }) => (
  <span className="inline-flex items-center gap-1 text-[13.5px] font-medium leading-5 tabular-nums text-support-slate dark:text-darkTextPrimary">
    {/* 17px: lucide's current MessageSquare spans x 2–22 (the mock's older glyph 3–21); at 17 it inks the
        drawn 15 css px. The 1px spacer keeps the count where UP-Default draws it. */}
    <MessageSquare aria-hidden="true" size={17} strokeWidth={1.5} className="mr-px shrink-0 text-support-muted" />
    <span>
      {formatCount(count)}
      <span className="sr-only"> {count === 1 ? "reply" : "replies"}</span>
    </span>
  </span>
);

/**
 * The whole row is the title link's hit area (one tab stop per ticket; the arrow is its visual cue).
 * Its focus indicator is the shared AA blue drawn inside the row (5.1:1 on white; the drawn #0788f3
 * read 3.2:1 on the waiting tint) — an outline would be clipped by the table card.
 */
const rowLinkClass = cn(
  "outline-none after:absolute after:inset-0 after:z-[1] after:content-['']",
  "focus-visible:after:shadow-[inset_0_0_0_2px_var(--color-support-primary-text)] dark:focus-visible:after:shadow-[inset_0_0_0_2px_var(--color-support-primary-text-dark)]",
);

const ArrowCue = () => (
  <span
    aria-hidden="true"
    className="flex size-8 items-center justify-center rounded-full bg-support-surface-muted text-subTextColor transition-colors duration-150 group-hover:bg-support-divider group-hover:text-headingTextColor dark:bg-white/10 dark:text-darkTextPrimary"
  >
    <ArrowRight size={16} strokeWidth={2} />
  </span>
);

const TicketTableRow = memo(({ row }: { row: TicketRequesterSummary }) => {
  const waiting = row.status === "pending_customer";
  return (
    <tr
      data-ticket-row={row.id}
      data-status={row.status}
      className={cn(
        "group relative transition-colors duration-150",
        waiting
          ? "bg-[#fbfaff] hover:bg-[#f7f4ff] dark:bg-[#8e51ff]/[0.07]"
          : "bg-white hover:bg-[#fafbfb] dark:bg-transparent dark:hover:bg-white/[0.03]",
      )}
    >
      <td className={cn(TD, "pl-6 pr-4")}>
        {waiting ? (
          <span aria-hidden="true" className="absolute left-0 top-[18px] h-11 w-[3px] rounded-full bg-[#8e51ff]" />
        ) : null}
        <div className="flex min-w-0 items-center gap-3.5">
          <CategoryTile category={row} size={44} />
          <div className="min-w-0 flex-1">
            <Link
              href={ticketHref(row.id)}
              // always: the drawn 41–44 character titles are already cut on 1280 px laptops (986 px list)
              title={row.title}
              className={cn(
                "block truncate text-[15px] font-medium leading-[22px] text-headingTextColor dark:text-darkTextPrimary",
                rowLinkClass,
              )}
            >
              {row.title}
            </Link>
            <div className="mt-[2px]">
              <MetaLine row={row} />
            </div>
          </div>
        </div>
      </td>
      <td className={TD}>
        <div className={CELL}>
          <PriorityBadge priority={row.priority} />
        </div>
      </td>
      <td className={TD}>
        <div className={CELL}>
          <StatusPill status={row.status} />
        </div>
      </td>
      <td className={cn(TD, "pr-3")}>
        <div className={CELL}>
          <Assignee agent={row.agent} className="max-w-full gap-2" />
        </div>
      </td>
      <td className={TD}>
        <div className={CELL}>
          <Replies count={row.public_message_count} />
        </div>
      </td>
      <td className={TD}>
        <div className={CELL}>
          {/* UP-Default draws the stars 1.5px left of the column edge the "Not rated" dash starts on (2x ink scan) */}
          <RatingStars rating={row.rating} className={row.rating ? "-ml-[1.5px]" : undefined} />
        </div>
      </td>
      <td className={TD}>
        <div className={CELL}>
          <ArrowCue />
        </div>
      </td>
    </tr>
  );
});
TicketTableRow.displayName = "TicketTableRow";

const TicketCardRow = memo(({ row }: { row: TicketRequesterSummary }) => {
  const waiting = row.status === "pending_customer";
  return (
    <li
      data-ticket-card={row.id}
      data-status={row.status}
      className={cn(
        "group relative transition-colors duration-150",
        waiting ? "bg-[#fbfaff] dark:bg-[#8e51ff]/[0.07]" : "bg-white hover:bg-[#fafbfb] dark:bg-transparent",
      )}
    >
      {waiting ? (
        <span aria-hidden="true" className="absolute bottom-4 left-0 top-4 w-[3px] rounded-full bg-[#8e51ff]" />
      ) : null}
      <div className="flex gap-3 px-4 py-4 @min-[640px]/list:gap-3.5 @min-[640px]/list:px-5">
        <CategoryTile category={row} size={40} className="@min-[640px]/list:!size-11" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <Link
              href={ticketHref(row.id)}
              title={row.title}
              className={cn(
                "line-clamp-2 min-w-0 flex-1 break-words text-[15px] font-medium leading-[22px] text-headingTextColor dark:text-darkTextPrimary",
                rowLinkClass,
              )}
            >
              {row.title}
            </Link>
            <span className="hidden shrink-0 @min-[640px]/list:block">
              <ArrowCue />
            </span>
          </div>
          <div className="mt-0.5">
            <MetaLine row={row} wrap />
          </div>
          {/* Two groups that wrap as wholes: state (priority, status) then people (assignee, replies, rating). */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <span className="flex items-center gap-x-4">
              <PriorityBadge priority={row.priority} />
              <StatusPill status={row.status} />
            </span>
            <span className="flex min-w-0 items-center gap-x-4">
              <Assignee agent={row.agent} className="min-w-0 max-w-[200px] gap-2" />
              <Replies count={row.public_message_count} />
              {row.rating ? <RatingStars rating={row.rating} /> : null}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
});
TicketCardRow.displayName = "TicketCardRow";

/** Skeleton row inside the same <table> (same colgroup → nothing moves when data lands). */
const SkeletonTableRow = () => (
  <tr aria-hidden="true">
    <td className={cn(TD, "pl-6 pr-4")}>
      <div className="flex items-center gap-3.5">
        <Skeleton className="size-11" rounded="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-[70%] max-w-[360px]" />
          <Skeleton className="h-3 w-[45%] max-w-[240px]" />
        </div>
      </div>
    </td>
    <td className={TD}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-[14px] w-[18px]" rounded="sm" />
        <Skeleton className="h-3 w-12" />
      </div>
    </td>
    <td className={TD}>
      <Skeleton className="h-6 w-[84px]" rounded="full" />
    </td>
    <td className={TD}>
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-7" rounded="full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </td>
    <td className={TD}>
      <Skeleton className="h-3 w-8" />
    </td>
    <td className={TD}>
      <Skeleton className="h-3 w-[68px]" />
    </td>
    <td className={TD}>
      <Skeleton className="size-8" rounded="full" />
    </td>
  </tr>
);

const SkeletonCardRow = () => (
  <li aria-hidden="true" className="flex gap-3 px-4 py-4 @min-[640px]/list:px-5">
    <Skeleton className="size-10 shrink-0" rounded="lg" />
    <div className="min-w-0 flex-1 space-y-2.5">
      <Skeleton className="h-3.5 w-[80%]" />
      <Skeleton className="h-3 w-[55%]" />
      <div className="flex gap-3 pt-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-20" rounded="full" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  </li>
);

const TableHead = () => (
  <thead>
    <tr>
      <th scope="col" className={cn(TH, "pl-6")}>
        Ticket
      </th>
      <th scope="col" className={TH}>
        Priority
      </th>
      <th scope="col" className={TH}>
        Status
      </th>
      <th scope="col" className={TH}>
        Assigned
      </th>
      <th scope="col" className={TH}>
        Replies
      </th>
      <th scope="col" className={TH}>
        Rating
      </th>
      <th scope="col" className={TH}>
        <span className="sr-only">Open</span>
      </th>
    </tr>
  </thead>
);

const ColGroup = () => (
  <colgroup>
    <col />
    {COLS.map((width) => (
      <col key={width} style={{ width }} />
    ))}
  </colgroup>
);

interface FooterProps {
  meta: ListPage["meta"];
  rowsOnPage: number;
  onPageChange: (page: number) => void;
  disabled: boolean;
}

/**
 * "Showing 1–5 of 7 tickets" (12.5px #505553, the range #0f1613/500, en
 * dash) + the pager; 56 tall with a 1px rule (2px with the last row's
 * divider, as drawn), text at 20, pager 16 from the right. Narrow footers
 * stack the range above a compact pager.
 */
const TableFooter = ({ meta, rowsOnPage, onPageChange, disabled }: FooterProps) => {
  const limit = meta.limit || LIST_PAGE_SIZE;
  const range = pageRange(meta.page, limit, meta.total);
  const to = Math.min(meta.total, range.from + Math.max(0, rowsOnPage - 1));
  const label = rowsOnPage > 0 ? `${formatCount(range.from)}–${formatCount(to)}` : "0";
  const pages = reachablePages(meta, limit);
  const capped = meta.total > pages * limit && meta.page >= MAX_REACHABLE_PAGE;
  return (
    <div
      data-support-footer
      className="flex flex-col gap-3 border-t border-support-divider px-4 py-3 @min-[640px]/list:h-14 @min-[640px]/list:flex-row @min-[640px]/list:items-center @min-[640px]/list:justify-between @min-[640px]/list:gap-4 @min-[640px]/list:py-0 @min-[640px]/list:pl-5 @min-[640px]/list:pr-4 dark:border-darkBorder"
    >
      <p className="text-[13px] leading-5 text-subTextColor dark:text-darkTextSecondary">
        Showing{" "}
        <span className="ml-px mr-[2px] text-[12.5px] font-medium text-headingTextColor dark:text-darkTextPrimary">{label}</span>{" "}
        of{" "}
        {formatCount(meta.total)} {ticketsWord(meta.total)}
        {capped ? <span className="text-support-muted-text"> · search to find older tickets</span> : null}
      </p>
      <TicketPager
        page={meta.page}
        totalPages={pages}
        onPageChange={onPageChange}
        busy={disabled}
        siblings={0}
        className="@min-[640px]/list:hidden"
      />
      <TicketPager
        page={meta.page}
        totalPages={pages}
        onPageChange={onPageChange}
        busy={disabled}
        className="hidden @min-[640px]/list:flex"
      />
    </div>
  );
};

interface TicketTableProps {
  page: ListPage;
  loading: boolean;
  onPageChange: (page: number) => void;
}

/**
 * The table card (REQ-U-04…06, -12…15). ≥ 960px content: a real <table>
 * (scope'd headers, one link per row covering it, the arrow column labelled
 * for AT); below: the same rows as a card list. Both live in the DOM and CSS
 * shows one (display:none keeps the other out of the accessibility tree), so
 * resizing never re-renders or shifts. While a new page/filter loads the
 * rows stay, dimmed, with aria-busy.
 */
const TicketTableImpl = ({ page, loading, onPageChange }: TicketTableProps) => {
  const { rows, meta } = page;
  return (
    <section
      aria-labelledby="ticket-list-heading"
      aria-busy={loading || undefined}
      // programmatic focus target after the error card's "Try again" (WCAG 2.4.3)
      tabIndex={-1}
      data-support-table
      className={cn(CARD, COLUMN_VARS, "outline-none", FOCUS_RING)}
    >
      <h2 id="ticket-list-heading" className="sr-only">
        Your tickets
      </h2>
      <div className={cn("transition-opacity duration-150", loading && "pointer-events-none opacity-60")}>
        <table className="hidden w-full table-fixed border-separate border-spacing-0 @min-[960px]/list:table">
          <ColGroup />
          <TableHead />
          <tbody>
            {rows.map((row) => (
              <TicketTableRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
        <ul className="divide-y divide-support-divider @min-[960px]/list:hidden dark:divide-darkBorder">
          {rows.map((row) => (
            <TicketCardRow key={row.id} row={row} />
          ))}
        </ul>
      </div>
      <TableFooter meta={meta} rowsOnPage={rows.length} onPageChange={onPageChange} disabled={loading} />
    </section>
  );
};

/** Memoised: a keystroke in the search re-renders nothing here until the page object changes. */
export const TicketTable = memo(TicketTableImpl);

/** First paint / no data yet: the same card with skeleton rows (exact geometry, no CLS). */
export const TicketTableSkeleton = ({ rows = LIST_PAGE_SIZE }: { rows?: number }) => (
  <section role="status" aria-label="Loading tickets" className={cn(CARD, COLUMN_VARS)}>
    <table className="hidden w-full table-fixed border-separate border-spacing-0 @min-[960px]/list:table">
      <ColGroup />
      <TableHead />
      <tbody>
        {Array.from({ length: rows }, (_, index) => (
          <SkeletonTableRow key={index} />
        ))}
      </tbody>
    </table>
    <ul className="divide-y divide-support-divider @min-[960px]/list:hidden dark:divide-darkBorder">
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonCardRow key={index} />
      ))}
    </ul>
    <div className="flex h-14 items-center justify-between border-t border-support-divider pl-5 pr-4 dark:border-darkBorder">
      <Skeleton className="h-3 w-40" />
      <div className="flex gap-1.5">
        <Skeleton className="size-8" />
        <Skeleton className="size-8" />
        <Skeleton className="size-8" />
      </div>
    </div>
    <span className="sr-only">Loading tickets…</span>
  </section>
);

/** Shared frame for the list's error card. */
export const TicketCardFrame = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn(CARD, className)}>{children}</div>
);

export default TicketTable;
