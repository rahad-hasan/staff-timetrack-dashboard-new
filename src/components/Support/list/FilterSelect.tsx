"use client";

import type { ReactNode } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SELECT_ROW_CLASS,
  SELECT_TRIGGER_CLASS,
  SelectPanel,
  useKeyboardModality,
} from "@/components/Support/primitives/SupportSelect";

/** Radix reserves "" for "no value": the "All …" option uses this sentinel. */
export const ALL_VALUE = "__all__";

interface FilterSelectProps {
  /** null = the "All …" option */
  value: string | null;
  onValueChange: (value: string | null) => void;
  /** accessible name of the combobox ("Filter by status") */
  label: string;
  /** trigger content in the default (no value) state, e.g. "All statuses" */
  placeholder: string;
  /** trigger content when a value is set (dot/tile + blue label) */
  selected?: ReactNode;
  /** "start" for status (drawn), "end" for category (drawn: extends 20px left of its trigger) */
  align: "start" | "end";
  disabled?: boolean;
  children: ReactNode;
  triggerProps?: Record<`data-${string}`, string>;
  className?: string;
}

/**
 * The two drawn filter dropdowns (UP-Status / UP-Category / UP-Filtered),
 * built on Radix Select (combobox + listbox, typeahead, arrows, Home/End,
 * Escape returns focus) and the shared support select chrome — measured at
 * 1440 (2× ÷ 2): text at 13, chevron 16 at right 13; open: #0788f3 border,
 * chevron up; with a value: #0788f3 border, #f0f7fe fill, blue 14/500 value,
 * blue chevron; the panel 240 wide; selected row + check 16 #0788f3.
 */
export const FilterSelect = ({
  value,
  onValueChange,
  label,
  placeholder,
  selected,
  align,
  disabled,
  children,
  triggerProps,
  className,
}: FilterSelectProps) => {
  const hasValue = value !== null;
  const modality = useKeyboardModality();
  return (
    <SelectPrimitive.Root
      value={value ?? ALL_VALUE}
      onValueChange={(next) => onValueChange(next === ALL_VALUE ? null : next)}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        aria-label={label}
        {...modality.trigger}
        {...triggerProps}
        className={cn(
          SELECT_TRIGGER_CLASS,
          "pl-3",
          hasValue
            ? "border-primary bg-support-primary-tint dark:bg-primary/15"
            : "border-borderColor hover:border-support-border-hover dark:border-darkBorder dark:bg-darkPrimaryBg",
          className,
        )}
      >
        {/* Rendered directly (not via Select.Value, which wraps its children in a keyed Fragment). */}
        <span className="flex min-w-0 items-center">
          {hasValue && selected ? (
            selected
          ) : (
            // Drawn #8a9190 (3.2:1); the select's visible value is text → the AA grey twin (5.0:1, plan §7).
            <span className="truncate text-[14px] leading-5 text-support-muted-text dark:text-darkTextSecondary">
              {placeholder}
            </span>
          )}
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            aria-hidden="true"
            size={16}
            strokeWidth={2}
            className={cn(
              "shrink-0 transition-transform duration-150 group-data-[state=open]/trigger:rotate-180",
              hasValue
                ? "text-primary group-data-[state=open]/trigger:text-primary"
                : "text-subTextColor dark:text-darkTextSecondary",
            )}
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPanel
        modality={modality}
        align={align}
        className="z-50 w-[240px] max-w-[calc(100vw-32px)] max-h-[min(420px,var(--radix-select-content-available-height))] data-[state=open]:zoom-in-[0.98]"
      >
        {children}
      </SelectPanel>
    </SelectPrimitive.Root>
  );
};

interface FilterOptionProps {
  value: string;
  /** the text typeahead and the trigger use */
  text: string;
  /** leading glyph (status dot, category tile, sliders icon) */
  leading?: ReactNode;
  /** right-aligned muted count (status dropdown) */
  count?: number | null;
  /** 32 for statuses and "All categories", 42 for category rows (measured: 44px pitch with the 2px gap) */
  height?: 32 | 42;
  /** extra classes for the row */
  className?: string;
}

/**
 * One dropdown row: glyph + label (+ count) + the selected row's check. Radix names an option by
 * its ItemText (`aria-labelledby`), so the count is repeated INSIDE it as visually hidden text —
 * "In progress, 1 ticket" — and the drawn count beside it is hidden from AT (step-9a review: the
 * listbox read "Open", "In progress"… with no counts). Safe because the trigger renders its own
 * value node, never `Select.Value` (which would copy ItemText).
 * The `{" "}` between the label and the drawn count keeps the row's text "Open 1", not "Open1":
 * label-in-name checks (WCAG 2.5.3, axe `label-content-name-mismatch`) read the visible text
 * as one string. A white-space-only run between flex items is never rendered.
 */
export const FilterOption = ({ value, text, leading, count, height = 32, className }: FilterOptionProps) => (
  <SelectPrimitive.Item
    value={value}
    textValue={text}
    className={cn(SELECT_ROW_CLASS, height === 42 ? "h-[42px]" : "h-8", "data-[disabled]:opacity-50", className)}
  >
    {leading ? <span className="mr-[10px] flex shrink-0 items-center">{leading}</span> : null}
    <SelectPrimitive.ItemText className="min-w-0 truncate">
      {text}
      {count !== undefined && count !== null ? (
        <span className="sr-only">{`, ${count} ${count === 1 ? "ticket" : "tickets"}`}</span>
      ) : null}
    </SelectPrimitive.ItemText>{" "}
    <span className="ml-auto flex shrink-0 items-center pl-3">
      {count !== undefined && count !== null ? (
        <span
          aria-hidden="true"
          className="text-[12.5px] font-normal leading-5 tabular-nums text-support-muted-text dark:text-darkTextSecondary"
        >
          {count}
        </span>
      ) : null}
      <SelectPrimitive.ItemIndicator className="ml-[10px] flex text-primary">
        <Check aria-hidden="true" size={16} strokeWidth={2} />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
);

export default FilterSelect;
