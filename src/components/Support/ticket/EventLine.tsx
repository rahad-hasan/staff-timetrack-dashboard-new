"use client";

import { memo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CircleCheck,
  CircleDot,
  Lock,
  MessageCircleQuestion,
  PencilLine,
  RotateCcw,
  Star,
  Ticket,
  UserRoundCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RatingStars, STATUS_TOKENS } from "@/components/Support/primitives";
import { formatAbsolute, formatClock } from "@/lib/supportFormat";
import type { TicketStatus } from "@/types/support";
import type { EventLineCopy, FixedEventTone } from "./ticketCopy";

const STATUS_ICON: Record<TicketStatus, LucideIcon> = {
  open: CircleDot,
  in_progress: CircleDot,
  pending_customer: MessageCircleQuestion,
  resolved: CircleCheck,
  closed: Lock,
};

const TONE_ICON: Record<FixedEventTone, LucideIcon> = {
  created: Ticket,
  assigned: UserRoundCheck,
  reopened: RotateCcw,
  rated: Star,
  updated: PencilLine,
};

/** Tile tint + glyph colour per tone (TD-01: blue ticket, teal agent, amber clock …). */
const TONE_STYLE: Record<FixedEventTone, string> = {
  created: "bg-support-primary-soft text-primary dark:bg-primary/20",
  assigned: "bg-[#e6f8f6] text-[#00897b] dark:bg-[#00bba7]/20 dark:text-[#46ecd5]",
  reopened: "bg-[#fef9c2] text-[#bb4d00] dark:bg-[#f0b100]/15 dark:text-[#ffd230]",
  rated: "bg-[#fef5e7] text-[#d97706] dark:bg-[#f59e0b]/15 dark:text-[#fcd34d]",
  updated: "bg-support-surface-muted text-subTextColor dark:bg-white/10 dark:text-darkTextSecondary",
};

interface EventLineProps {
  copy: EventLineCopy;
  at: string;
}

/**
 * A public system line on the rail (TD-01: "Auto-assigned to Support Agent
 * · round robin  10:20 AM", "Status changed to In progress"): a 36px row —
 * the 28px tinted circle centred in the avatar column's 36px cell — with the
 * 14px #505553 sentence (names #0f1613/500, status words in their pill
 * colour) whose first line is centred on the glyph, and the 13px clock time
 * right-aligned on that line.
 */
export const EventLine = memo(function EventLine({ copy, at }: EventLineProps) {
  const statusTone = copy.tone === "status";
  const Icon = statusTone ? STATUS_ICON[copy.status] : TONE_ICON[copy.tone];
  const tile = statusTone ? undefined : TONE_STYLE[copy.tone];
  const statusToken = statusTone ? STATUS_TOKENS[copy.status] : null;
  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)] items-start gap-3 sm:gap-3.5">
      <span aria-hidden="true" className="flex size-9 items-center justify-center">
        <span
          className={cn(
            "relative z-[1] flex size-7 items-center justify-center rounded-full ring-4 ring-white dark:ring-darkSecondaryBg",
            tile,
          )}
          style={statusToken ? { backgroundColor: statusToken.pillBg, color: statusToken.pillText } : undefined}
        >
          <Icon className="size-[15px]" strokeWidth={2} />
        </span>
      </span>
      <p className="flex flex-wrap items-start gap-x-3 gap-y-0.5 py-[7px] text-[14px] leading-[22px] text-subTextColor dark:text-darkTextSecondary">
        <span className="min-w-0 flex-1">
          {copy.segments.map((segment, index) => {
            if (segment.kind === "strong") {
              return (
                <span key={index} className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                  {segment.text}
                </span>
              );
            }
            if (segment.kind === "status") {
              return (
                <span key={index} className={cn("font-medium", STATUS_TOKENS[segment.status].textClass)}>
                  {segment.text}
                </span>
              );
            }
            if (segment.kind === "stars") {
              return (
                <RatingStars
                  key={index}
                  rating={segment.rating}
                  size={14}
                  gap={2}
                  className="ml-1 inline-flex translate-y-[2px]"
                />
              );
            }
            return <span key={index}>{segment.text}</span>;
          })}
        </span>
        <time
          dateTime={at}
          title={formatAbsolute(at)}
          className="shrink-0 text-[13px] leading-[22px] text-support-muted-text dark:text-darkTextSecondary"
          suppressHydrationWarning
        >
          {formatClock(at)}
        </time>
      </p>
    </div>
  );
});

export default EventLine;
