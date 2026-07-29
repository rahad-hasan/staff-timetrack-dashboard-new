"use client";

import { memo, useCallback } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ISuspensionEvent } from "@/types/trackingSuspension";
import { SeverityChip } from "./SeverityChip";
import { ReasonChip } from "./ReasonChip";
import { OngoingBadge } from "./OngoingDot";
import { SourceIcon } from "./SourceIcon";
import { EventDetail } from "./EventDetail";

interface Props {
  event: ISuspensionEvent;
  expanded: boolean;
  onToggle: (id: number) => void;
  timezone: string;
}

function EventListItemImpl({ event, expanded, onToggle, timezone }: Props) {
  const handleToggle = useCallback(() => onToggle(event.id), [event.id, onToggle]);

  return (
    <li className="rounded-[10px] border border-borderColor bg-bgPrimary dark:border-darkBorder dark:bg-darkPrimaryBg">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls={`event-detail-${event.id}`}
        className={cn(
          "flex w-full items-start gap-3 px-3 py-3 text-left transition",
          "hover:bg-bgSecondary/60 dark:hover:bg-darkSecondaryBg/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          expanded && "bg-bgSecondary/60 dark:bg-darkSecondaryBg/40",
        )}
      >
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityChip severity={event.severity} />
            <ReasonChip code={event.reason_code || (event.reason as string)} />
            {event.ongoing && <OngoingBadge />}
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-subTextColor dark:text-darkTextSecondary">
              <SourceIcon source={event.source} />
              {event.source.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subTextColor dark:text-darkTextSecondary">
            <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
              {event.project?.name ?? "No project"}
            </span>
            {event.task?.name && (
              <>
                <span aria-hidden>·</span>
                <span>{event.task.name}</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="text-subTextColor dark:text-darkTextSecondary">
              {event.starts_at_format}
            </span>
            <span aria-hidden className="text-subTextColor dark:text-darkTextSecondary">→</span>
            <span className="text-subTextColor dark:text-darkTextSecondary">
              {event.ongoing
                ? "Ongoing"
                : event.ends_at_format ?? "—"}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 font-medium tabular-nums text-headingTextColor dark:text-darkTextPrimary">
              <Clock className="size-3.5" aria-hidden />
              {event.duration}
            </span>
          </div>
        </div>

        <ChevronDown
          aria-hidden
          className={cn(
            "mt-1 size-4 shrink-0 text-subTextColor transition-transform dark:text-darkTextSecondary",
            expanded && "rotate-180 text-primary",
          )}
        />
      </button>

      {expanded && (
        <div
          id={`event-detail-${event.id}`}
          role="region"
          className="border-t border-borderColor px-3 py-3 dark:border-darkBorder"
        >
          <EventDetail eventId={event.id} timezone={timezone} />
        </div>
      )}
    </li>
  );
}

export const EventListItem = memo(
  EventListItemImpl,
  (prev, next) =>
    prev.event.id === next.event.id &&
    prev.event.ongoing === next.event.ongoing &&
    prev.event.duration === next.event.duration &&
    prev.event.severity === next.event.severity &&
    prev.event.status === next.event.status &&
    prev.expanded === next.expanded &&
    prev.timezone === next.timezone &&
    prev.onToggle === next.onToggle,
);
