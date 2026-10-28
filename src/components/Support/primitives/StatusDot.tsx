import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/types/support";
import { STATUS_TOKENS } from "./tokens";

interface StatusDotProps {
  status: TicketStatus;
  /**
   * Diameter of the coloured disc in px (measured): 6 in pills, 8 in the
   * dropdown rows and the select value, 6 + ring in the hero legend.
   */
  size?: number;
  /** the hero legend draws a 1.5px white ring around the disc (UP-Default legend) */
  ring?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** The filled status disc used by pills, selects, the legend and the bar. Decorative. */
export const StatusDot = ({ status, size = 6, ring = false, className, style }: StatusDotProps) => (
  <span
    aria-hidden="true"
    className={cn("inline-block shrink-0 rounded-full", className)}
    style={{
      width: size,
      height: size,
      backgroundColor: STATUS_TOKENS[status].dot,
      boxShadow: ring ? "0 0 0 1.5px #ffffff" : undefined,
      ...style,
    }}
  />
);

export default StatusDot;
