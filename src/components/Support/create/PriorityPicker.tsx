"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { TICKET_PRIORITY_VALUES, type TicketPriority } from "@/types/support";
import { PRIORITY_TOKENS, PriorityBars } from "@/components/Support/primitives";

/** Ascending, as read left to right (§4.2 lists Critical first for menus; a picker reads low → high). */
const PICKER_ORDER: readonly TicketPriority[] = TICKET_PRIORITY_VALUES;

/** Requester-facing hint for the picked priority (D1: requesters pick priority). */
export const PRIORITY_HINTS: Record<TicketPriority, string> = {
  low: "A question or a small issue — no rush.",
  medium: "Something isn't working the way it should.",
  high: "A key feature is broken and it is slowing you down.",
  critical: "You can't work at all right now.",
};

interface PriorityPickerProps {
  value: TicketPriority;
  onChange: (priority: TicketPriority) => void;
  /** id of the visible "Priority" label */
  labelId: string;
  disabled?: boolean;
  name?: string;
}

/**
 * Priority as four radio segments (native radios: one tab stop, arrow keys
 * move and select) with the drawn 4-bar glyph and label; the picked one
 * takes the select's value state (#0788f3 border, #f0f7fe fill). The hint
 * under the group says what the choice means.
 */
export const PriorityPicker = ({ value, onChange, labelId, disabled = false, name }: PriorityPickerProps) => {
  const generated = useId();
  const groupName = name ?? `priority-${generated}`;
  const hintId = `${generated}-hint`;
  return (
    <div>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={hintId}
        className="grid grid-cols-2 gap-2 @min-[480px]/form:grid-cols-4"
        data-support-priority
      >
        {PICKER_ORDER.map((priority) => {
          const checked = value === priority;
          return (
            <label
              key={priority}
              className={cn(
                "relative flex h-11 cursor-pointer select-none items-center justify-center gap-2 rounded-lg border px-3 text-[13.5px] font-medium leading-5 transition-colors duration-150",
                "has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-support-primary-text dark:has-[:focus-visible]:outline-support-primary-text-dark",
                checked
                  ? // label in the AA brand twin (#066fc6, 4.75:1 on #f0f7fe); the border keeps #0788f3
                    "border-primary bg-support-primary-tint text-support-primary-text dark:bg-primary/15 dark:text-support-primary-text-dark"
                  : "border-borderColor bg-white text-support-slate hover:border-support-border-hover hover:bg-[#fafbfb] dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={priority}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(priority)}
                className="sr-only"
              />
              <PriorityBars priority={priority} />
              <span>{PRIORITY_TOKENS[priority].label}</span>
            </label>
          );
        })}
      </div>
      <p id={hintId} className="mt-1.5 text-[12.5px] leading-[18px] text-support-muted-text dark:text-darkTextSecondary">
        {PRIORITY_HINTS[value]}
      </p>
    </div>
  );
};

export default PriorityPicker;
