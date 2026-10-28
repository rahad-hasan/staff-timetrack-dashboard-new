"use client";

import { memo, useEffect, useId, useRef, useState, type Ref } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, Clock3, Copy, Mail, RotateCcw, Star, SquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_ICON_MAP, FOCUS_RING, PRIORITY_TOKENS, CategoryTile, hexToRgba, PriorityBars, RelativeTime, resolveCategory, StatusPill, SupportButton } from "@/components/Support/primitives";
import { SUPPORT_TICKETS_PATH, ticketHref } from "@/lib/support";
import { formatAbsolute, formatDayAndClock } from "@/lib/supportFormat";
import type { CategoryRef, TicketPriority, TicketSource, TicketStatus } from "@/types/support";
import { SOURCE_LABEL } from "./ticketCopy";

export interface TicketHeaderData {
  id: number;
  display_number: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  category_ref: CategoryRef | null;
  created_at: string;
  updated_at: string;
  source: TicketSource;
  expected_reply_by: string | null;
  reopened_from_id: number | null;
}

interface TicketHeaderCardProps {
  ticket: TicketHeaderData;
  /** the title (the page's h1, `tabIndex -1`): where focus lands when the rating popup has no opener to return to */
  titleRef?: Ref<HTMLHeadingElement>;
  /** "Rate this ticket" button (resolved/closed, unrated, rate-later allowed) */
  showRate: boolean;
  onRate: () => void;
  /** closed: "Open a new ticket" */
  onOpenNew: (() => void) | null;
  openingNew: boolean;
}

/**
 * Header pills follow TD-01's header row (26px tall, 14px text, 10px sides, 8px apart) — larger
 * than the 24px / 12px list pills. Text stays in the AA-safe requester tokens (TD-01 tints the
 * text with the tone colour: orange-500 / red-600 on the tint read 2.9–4.3 : 1 at 14px).
 */
const HEADER_PILL = "h-[26px] text-[14px]";

const PriorityPill = ({ priority }: { priority: TicketPriority }) => {
  const token = PRIORITY_TOKENS[priority];
  return (
    <span
      className="inline-flex h-[26px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[14px] font-medium leading-none text-support-slate dark:text-darkTextPrimary"
      style={{ backgroundColor: hexToRgba(token.color, 0.08), borderColor: hexToRgba(token.color, 0.28) }}
    >
      <PriorityBars priority={priority} />
      <span className="sr-only">Priority: </span>
      {token.label}
    </span>
  );
};

const CategoryPill = ({ category }: { category: { category: string; category_ref: CategoryRef | null } }) => {
  const resolved = resolveCategory(category);
  const Icon = CATEGORY_ICON_MAP[resolved.icon] ?? CATEGORY_ICON_MAP.question;
  return (
    <span
      className="inline-flex h-[26px] min-w-0 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-[14px] font-medium leading-none text-support-slate dark:text-darkTextPrimary"
      style={{ backgroundColor: hexToRgba(resolved.color, 0.08), borderColor: hexToRgba(resolved.color, 0.3) }}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" style={{ color: resolved.color }} strokeWidth={2} />
      <span className="sr-only">Category: </span>
      <span className="truncate">{resolved.name}</span>
    </span>
  );
};

/** The TKT chip: copies the number, then shows the TD-07 "✓ Ticket ID copied" tag under it. */
const CopyNumber = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API blocked (insecure origin / permissions): fall back to a selection copy.
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
      } catch {
        /* nothing else to try */
      }
      area.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={`Copy ticket ID ${value}`}
        className={cn("inline-flex h-[29px] items-center gap-1.5 rounded-lg border border-[#bedbff] bg-white px-2.5 text-[14px] font-medium leading-none text-support-primary-text outline-none transition-colors hover:bg-support-primary-tint dark:border-[#2b7fff]/40 dark:bg-transparent dark:text-support-primary-text-dark dark:hover:bg-primary/10", FOCUS_RING)}
      >
        {value}
        {/* TD-07 keeps the copy glyph; the dark "Ticket ID copied" tag below is the feedback */}
        <Copy aria-hidden="true" className="size-3.5" />
      </button>
      <span
        aria-hidden={!copied}
        className={cn(
          "pointer-events-none absolute left-0 top-[calc(100%+7px)] z-10 inline-flex h-[30px] items-center gap-2 whitespace-nowrap rounded-lg bg-headingTextColor px-3 text-[13.5px] font-medium leading-none text-white shadow-[0_8px_20px_-6px_rgba(15,22,19,0.35)] transition-opacity duration-150",
          copied ? "opacity-100" : "opacity-0",
        )}
      >
        <Check aria-hidden="true" className="size-3.5" />
        Ticket ID copied
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Ticket ID copied" : ""}
      </span>
    </span>
  );
};

/**
 * The ticket header (TD-01 header card, requester side): back, TKT chip
 * with copy, "Opened Sep 2, 2026 at 10:12 AM", "via Web form", "Updated …";
 * the category tile, the title (the page's h1) and the status / priority /
 * category pills; the action that fits the state (Rate this ticket / Open a
 * new ticket); "Expected reply by …" while a reply target runs. A Waiting-
 * on-you ticket carries the list row's violet accent (3px bar + tint).
 */
export const TicketHeaderCard = memo(function TicketHeaderCard({
  ticket,
  titleRef,
  showRate,
  onRate,
  onOpenNew,
  openingNew,
}: TicketHeaderCardProps) {
  const titleId = useId();
  const waiting = ticket.status === "pending_customer";
  const expected =
    ticket.expected_reply_by && (ticket.status === "open" || ticket.status === "in_progress")
      ? ticket.expected_reply_by
      : null;

  return (
    <section
      aria-labelledby={titleId}
      data-status={ticket.status}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-borderColor p-5 sm:p-6 dark:border-darkBorder dark:bg-darkSecondaryBg",
        waiting
          ? "bg-[linear-gradient(90deg,#f3eeff_0%,#f8f5ff_45%,#ffffff_100%)] dark:bg-none"
          : "bg-[linear-gradient(90deg,#ecf3ff_0%,#f4f5ff_45%,#ffffff_100%)] dark:bg-none",
      )}
    >
      {waiting ? (
        <span aria-hidden="true" className="absolute bottom-6 left-0 top-6 w-[3px] rounded-r-full bg-[#8e51ff]" />
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <Link
          href={SUPPORT_TICKETS_PATH}
          aria-label="Back to My Support Tickets"
          className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border border-borderColor bg-white text-headingTextColor outline-none transition-colors hover:bg-bgSecondary dark:border-darkBorder dark:bg-transparent dark:text-darkTextPrimary dark:hover:bg-white/5", FOCUS_RING)}
        >
          <ArrowLeft aria-hidden="true" className="size-[18px]" />
        </Link>
        <CopyNumber value={ticket.display_number} />
        <ul className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[14px] leading-5 text-subTextColor dark:text-darkTextSecondary">
          <li className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-primary" />
            <span suppressHydrationWarning>Opened {formatAbsolute(ticket.created_at)}</span>
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Mail aria-hidden="true" className="size-4 shrink-0 text-[#8e51ff]" />
            via {SOURCE_LABEL[ticket.source]}
          </li>
          {ticket.reopened_from_id ? (
            <li className="inline-flex items-center gap-1.5">
              <RotateCcw aria-hidden="true" className="size-4 shrink-0 text-subTextColor" />
              <Link
                href={ticketHref(ticket.reopened_from_id)}
                className={cn("rounded-sm text-support-primary-text underline-offset-4 outline-none hover:underline dark:text-support-primary-text-dark", FOCUS_RING)}
              >
                Follow-up to an earlier ticket
              </Link>
            </li>
          ) : null}
        </ul>
        {/* #5f6766, not the list's #697170: the header card is tinted (blue #ecf3ff, violet #ede7ff while
            waiting), where #697170 reads 4.49 / 4.16 : 1; #5f6766 reads 5.2 / 4.8 (integrator census). */}
        <p className="ml-auto hidden text-[13.5px] leading-5 text-[#5f6766] lg:block dark:text-darkTextSecondary">
          <RelativeTime value={ticket.updated_at} prefix="Updated " />
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        {/* TD-01: the 52px tile is centred on the title + pills block (title 30/36, 7px, 26px pills) */}
        <div className="flex min-w-0 items-center gap-4">
          <CategoryTile category={ticket} size={52} />
          <div className="min-w-0">
            {/* tabIndex -1: the landing spot when the rating popup closes with no opener to return to */}
            <h1
              ref={titleRef}
              id={titleId}
              tabIndex={-1}
              className={cn("rounded-md text-[22px] font-medium leading-[30px] text-headingTextColor outline-none [overflow-wrap:anywhere] md:text-[30px] md:leading-9 dark:text-darkTextPrimary", FOCUS_RING)}
            >
              {ticket.title}
            </h1>
            <div className="mt-[7px] flex flex-wrap items-center gap-2">
              <StatusPill status={ticket.status} className={HEADER_PILL} />
              <PriorityPill priority={ticket.priority} />
              <CategoryPill category={ticket} />
            </div>
          </div>
        </div>
        {showRate || onOpenNew ? (
          <div className={cn("flex shrink-0 flex-wrap gap-2.5 md:pt-1", !onOpenNew && "lg:hidden")}>
            {showRate ? (
              // desktop shows the "Rate this ticket" card beside the conversation; below lg the
              // aside sits under the thread, so the header carries the action
              <SupportButton
                variant="primary"
                size="lg"
                icon={<Star />}
                onClick={onRate}
                className="lg:hidden"
                data-support-rate-trigger=""
              >
                Rate this ticket
              </SupportButton>
            ) : null}
            {onOpenNew ? (
              <SupportButton variant="primary" size="lg" icon={<SquarePlus />} onClick={onOpenNew} loading={openingNew}>
                Open a new ticket
              </SupportButton>
            ) : null}
          </div>
        ) : null}
      </div>

      {expected ? (
        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-borderColor/80 pt-4 text-[14px] leading-5 text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
          <Clock3 aria-hidden="true" className="size-4 shrink-0 text-primary" />
          <span>
            Expected reply by{" "}
            <time dateTime={expected} title={formatAbsolute(expected)} className="font-medium text-headingTextColor dark:text-darkTextPrimary" suppressHydrationWarning>
              {formatDayAndClock(expected)}
            </time>
          </span>
        </div>
      ) : null}

      <p className="mt-3 text-[13.5px] leading-5 text-[#5f6766] lg:hidden dark:text-darkTextSecondary">
        <RelativeTime value={ticket.updated_at} prefix="Updated " />
      </p>
    </section>
  );
});

export default TicketHeaderCard;
