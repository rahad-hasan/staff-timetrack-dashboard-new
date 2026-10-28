import { cn } from "@/lib/utils";
import type { TicketPriority } from "@/types/support";
import { PRIORITY_BAR_HEIGHTS, PRIORITY_BAR_OFF, PRIORITY_TOKENS } from "./tokens";

interface PriorityBarsProps {
  priority: TicketPriority;
  className?: string;
}

/** The 4-bar glyph alone (18×14): bars 3px wide, 2px gaps, heights 5/8/11/14, bottom-aligned. */
export const PriorityBars = ({ priority, className }: PriorityBarsProps) => {
  const token = PRIORITY_TOKENS[priority];
  return (
    <span aria-hidden="true" className={cn("inline-flex h-[14px] items-end gap-[2px]", className)}>
      {PRIORITY_BAR_HEIGHTS.map((height, index) => (
        <span
          key={height}
          className="w-[3px] rounded-[1px]"
          style={{
            height,
            backgroundColor: index < token.bars ? token.color : PRIORITY_BAR_OFF,
          }}
        />
      ))}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: TicketPriority;
  /** hide the word and keep only the glyph (the label stays for screen readers) */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Priority glyph + label (§4.2): Critical 4 red, High 3 orange, Medium 2
 * blue, Low 1 grey. Measured: 8px gap, 13.5px/500 slate-700 label.
 */
export const PriorityBadge = ({ priority, iconOnly = false, className }: PriorityBadgeProps) => {
  const token = PRIORITY_TOKENS[priority];
  return (
    <span
      data-priority={priority}
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap text-[13.5px] font-medium leading-5 text-support-slate dark:text-darkTextPrimary",
        className,
      )}
    >
      <PriorityBars priority={priority} />
      <span className={cn(iconOnly && "sr-only")}>
        <span className="sr-only">Priority: </span>
        {token.label}
      </span>
    </span>
  );
};

export default PriorityBadge;
