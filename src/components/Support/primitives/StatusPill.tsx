import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/types/support";
import { StatusDot } from "./StatusDot";
import { STATUS_TOKENS } from "./tokens";

interface StatusPillProps {
  status: TicketStatus;
  /** "md" = the 24px table/ticket-page pill (measured); "sm" = a 20px variant for dense places */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Status pill with the requester labels (§4.1: `pending_customer` reads
 * "Waiting on you"). Measured on UP-Default: 24px tall, fully rounded, 1px
 * tinted border, 10px side padding, 6px dot, 6px gap, 12px/500 text
 * (e.g. "Open" = 63px wide, "Waiting on you" = 114px).
 */
export const StatusPill = ({ status, size = "md", className }: StatusPillProps) => {
  const token = STATUS_TOKENS[status];
  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-medium leading-none",
        size === "md" ? "h-6 px-2.5 text-[12px]" : "h-5 px-2 text-[11.5px]",
        token.pillClass,
        className,
      )}
    >
      <StatusDot status={status} size={size === "md" ? 6 : 5} />
      {token.label}
    </span>
  );
};

export default StatusPill;
