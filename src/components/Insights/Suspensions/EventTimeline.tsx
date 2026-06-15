import { memo } from "react";
import { cn } from "@/lib/utils";
import type {
  ISuspensionAuditEvent,
  TSuspensionAuditEventType,
} from "@/types/trackingSuspension";

const EVENT_LABEL: Record<TSuspensionAuditEventType, string> = {
  created: "Created",
  approved: "Approved",
  scheduled: "Scheduled",
  activated: "Activated",
  lifted: "Lifted",
  expired: "Expired",
  cancelled: "Cancelled",
  rejected: "Rejected",
  review_requested: "Review requested",
  enforcement_blocked: "Enforcement blocked",
  note_added: "Note added",
};

const EVENT_COLOR: Record<TSuspensionAuditEventType, string> = {
  created: "bg-gray-400",
  approved: "bg-emerald-500",
  scheduled: "bg-blue-500",
  activated: "bg-primary",
  lifted: "bg-emerald-500",
  expired: "bg-gray-400",
  cancelled: "bg-gray-500",
  rejected: "bg-red-500",
  review_requested: "bg-amber-500",
  enforcement_blocked: "bg-red-500",
  note_added: "bg-blue-400",
};

function eventLabel(type: string) {
  return (
    EVENT_LABEL[type as TSuspensionAuditEventType] ??
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function EventTimelineImpl({ events }: { events: ISuspensionAuditEvent[] }) {
  if (!events?.length) {
    return (
      <p className="rounded-md border border-dashed border-borderColor px-3 py-3 text-center text-xs text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
        No audit events recorded.
      </p>
    );
  }
  return (
    <ol className="relative space-y-3 border-l border-borderColor pl-5 dark:border-darkBorder">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            className={cn(
              "absolute -left-[26px] top-1.5 size-3 rounded-full ring-4 ring-bgPrimary dark:ring-darkPrimaryBg",
              EVENT_COLOR[event.event_type as TSuspensionAuditEventType] ?? "bg-gray-400",
            )}
            aria-hidden
          />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
              {eventLabel(event.event_type)}
            </span>
            <span className="text-xs text-subTextColor dark:text-darkTextSecondary">
              {event.created_at_format}
            </span>
          </div>
          {(event.from_status || event.to_status) && (
            <p className="mt-0.5 text-xs text-subTextColor dark:text-darkTextSecondary">
              {event.from_status ?? "—"}{" "}
              <span aria-hidden>→</span> {event.to_status ?? "—"}
            </p>
          )}
          {event.note && (
            <p className="mt-1 text-xs text-headingTextColor dark:text-darkTextPrimary">
              {event.note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

export const EventTimeline = memo(EventTimelineImpl);
