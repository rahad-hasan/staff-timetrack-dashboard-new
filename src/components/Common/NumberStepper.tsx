"use client";

import { Minus, Plus, type LucideIcon } from "lucide-react";

import NumberInput from "@/components/Common/NumberInput";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  /** `NaN` while the box is empty — the same contract `NumberInput` reports. */
  value?: unknown;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Unit rendered inside the track, right of the number ("Minutes"). */
  suffix?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}

/**
 * `− value +` stepper around `NumberInput`.
 *
 * The whole point of `NumberInput` is that an emptied box reports `NaN` rather
 * than `undefined` or a substituted number, because react-hook-form's `get()`
 * answers an `undefined` field with its `defaultValues` entry — which made the
 * deleted digit reappear on the keystroke that removed it. That contract is
 * easy to destroy from a wrapper, so this component is careful about it:
 *
 * - Typing is passed straight through, `NaN` included. The field stays
 *   clearable, and Zod reports the same "required" message it would for a
 *   missing number.
 * - Only the − / + buttons clamp, and they treat `NaN` as "start from the
 *   floor" rather than writing 0 behind the user's back.
 */
const NumberStepper = ({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  suffix,
  icon: Icon,
  disabled,
  ariaLabel,
  className,
}: NumberStepperProps) => {
  const current = typeof value === "number" && Number.isFinite(value) ? value : null;

  const nudge = (direction: 1 | -1) => {
    // An empty box has no number to step from. Stepping up should land on the
    // floor, stepping down should stay there — never silently write 0.
    const base = current ?? min;
    const next = current === null ? base : base + direction * step;
    onChange(Math.min(max, Math.max(min, next)));
  };

  const atMin = current !== null && current <= min;
  const atMax = current !== null && current >= max;

  return (
    <div
      className={cn(
        "flex h-11 items-center rounded-lg border border-borderColor bg-bgPrimary dark:border-darkBorder dark:bg-darkPrimaryBg",
        disabled && "opacity-50",
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Decrease ${ariaLabel}`}
        disabled={disabled || atMin}
        onClick={() => nudge(-1)}
        className="flex h-full w-11 shrink-0 cursor-pointer items-center justify-center rounded-l-lg text-subTextColor transition-colors hover:text-headingTextColor disabled:pointer-events-none disabled:opacity-40 dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
      >
        <Minus className="size-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
        {Icon && (
          <Icon className="size-4 shrink-0 text-subTextColor dark:text-darkTextSecondary" />
        )}
        <NumberInput
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-label={ariaLabel}
          // The track already draws the border; the inner input must not draw a
          // second one or the control reads as a box inside a box.
          className="h-9 min-w-0 flex-1 border-0 bg-transparent px-0 text-center shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        {suffix && (
          <span className="shrink-0 pr-1 text-sm text-subTextColor dark:text-darkTextSecondary">
            {suffix}
          </span>
        )}
      </div>

      <button
        type="button"
        aria-label={`Increase ${ariaLabel}`}
        disabled={disabled || atMax}
        onClick={() => nudge(1)}
        className="flex h-full w-11 shrink-0 cursor-pointer items-center justify-center rounded-r-lg text-subTextColor transition-colors hover:text-headingTextColor disabled:pointer-events-none disabled:opacity-40 dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
};

export default NumberStepper;
