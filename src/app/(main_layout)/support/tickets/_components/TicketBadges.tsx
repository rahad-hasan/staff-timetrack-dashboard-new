import { cn } from "@/lib/utils";
import {
  PRIORITY_BADGE_CLASSES,
  PRIORITY_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  TicketPriority,
  TicketStatus,
} from "@/types/support";

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export const TicketStatusBadge = ({ status, className }: StatusBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      STATUS_BADGE_CLASSES[status],
      className,
    )}
  >
    {STATUS_LABELS[status]}
  </span>
);

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

export const TicketPriorityBadge = ({
  priority,
  className,
}: PriorityBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      PRIORITY_BADGE_CLASSES[priority],
      className,
    )}
  >
    {PRIORITY_LABELS[priority]}
  </span>
);
