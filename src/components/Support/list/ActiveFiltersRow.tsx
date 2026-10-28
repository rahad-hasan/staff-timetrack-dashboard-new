"use client";

import { memo } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ticketsWord } from "@/lib/supportFormat";
import { FOCUS_RING } from "@/components/Support/primitives";

interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFiltersRowProps {
  /** filtered result count (keyword included) */
  shown: number | null;
  /** the requester's grand total (`GET /tickets/counts`), null when unknown */
  total: number | null;
  chips: ActiveFilterChip[];
  onClearAll: () => void;
}

/**
 * Chips row (REQ-U-10, UP-Filtered / UP-NoResults), only while a dropdown
 * filter is set: "Showing N of M tickets" (13.5/500 #505553 — N = the
 * filtered set, M = every ticket), one blue chip per dropdown filter
 * (20 tall, px 10, primary/10, 12/500 + a 12px × 7px after the label) and
 * "Clear all"; 10px apart (re-measured), 20 tall, 24 above the table. The
 * keyword never becomes a chip. `data-support-chip` / `data-support-clear-all`
 * are the focus targets the page uses after a chip or the row goes away.
 */
const ActiveFiltersRowImpl = ({ shown, total, chips, onClearAll }: ActiveFiltersRowProps) => (
  <div data-support-chips className="flex min-h-5 flex-wrap items-center gap-x-2.5 gap-y-2">
    <p className="text-[13.5px] font-medium leading-5 text-subTextColor dark:text-darkTextSecondary">
      {shown === null
        ? "Showing filtered tickets"
        : total === null
          ? `Showing ${shown} ${ticketsWord(shown)}`
          : `Showing ${shown} of ${total} ${ticketsWord(total)}`}
    </p>
    {chips.map((chip) => (
      <button
        key={chip.key}
        type="button"
        onClick={chip.onRemove}
        aria-label={`Remove ${chip.label} filter`}
        data-support-chip={chip.key}
        className={cn(
          "inline-flex h-5 max-w-full items-center gap-[7px] rounded-full bg-primary/10 px-2.5 text-[12px] font-medium leading-none text-support-primary-text outline-none transition-colors hover:bg-primary/[0.16] dark:bg-primary/20 dark:text-support-primary-text-dark",
          FOCUS_RING,
        )}
      >
        <span className="truncate">{chip.label}</span>
        <X aria-hidden="true" size={12} strokeWidth={2} className="shrink-0" />
      </button>
    ))}
    <button
      type="button"
      onClick={onClearAll}
      data-support-clear-all
      className={cn(
        "rounded-sm text-[13.5px] font-medium leading-5 text-support-primary-text outline-none underline-offset-2 hover:underline dark:text-support-primary-text-dark",
        FOCUS_RING,
      )}
    >
      Clear all
    </button>
  </div>
);

export const ActiveFiltersRow = memo(ActiveFiltersRowImpl);

export default ActiveFiltersRow;
