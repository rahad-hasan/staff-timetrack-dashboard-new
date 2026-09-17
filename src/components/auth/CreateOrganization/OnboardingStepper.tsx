"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface OnboardingStepperProps {
  steps: ReadonlyArray<{ id: string; title: string }>;
  activeIndex: number;
  /**
   * `stepper` = numbered badges with titles (the default; the getting-started
   * checklist and the tour rail read this shape). `bar` = one filled track, no
   * per-step affordances — what the signup dialog's design asks for.
   */
  variant?: "stepper" | "bar";
  className?: string;
}

/** Compact progress rail for the create-organization wizard. */
const OnboardingStepper = ({
  steps,
  activeIndex,
  variant = "stepper",
  className,
}: OnboardingStepperProps) => {
  if (variant === "bar") {
    // Steps are counted inclusive of the one being worked on, so a 2-step
    // wizard is half full on step 1 and full on step 2 — the bar reports
    // "how far in are we", not "how much is finished". `steps.length` is
    // floored at 1 so an empty list can never divide by zero.
    const total = Math.max(1, steps.length);
    const current = Math.min(total, Math.max(0, activeIndex) + 1);

    return (
      <div
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        // Without this a screen reader announces a bare percentage, which says
        // nothing about how many screens are left.
        aria-valuetext={`Step ${current} of ${total}`}
        className={cn(
          "h-2.5 w-full overflow-hidden rounded-full bg-bgSecondary dark:bg-darkTertiaryBg",
          className,
        )}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#427fe3,#3360c8)] transition-[width] duration-300 ease-out"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    );
  }

  return (
    <ol
      className={cn("flex items-center gap-2", className)}
      aria-label="Setup progress"
    >
      {steps.map((step, index) => {
        const isDone = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <span
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                isDone && "border-primary bg-primary text-primary-foreground",
                isActive && !isDone && "border-primary text-primary",
                !isDone &&
                  !isActive &&
                  "border-borderColor text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary",
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                "hidden truncate text-xs font-medium sm:inline",
                isActive
                  ? "text-headingTextColor dark:text-darkTextPrimary"
                  : "text-subTextColor dark:text-darkTextSecondary",
              )}
            >
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "h-px flex-1 rounded-full",
                  isDone ? "bg-primary" : "bg-borderColor dark:bg-darkBorder",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default OnboardingStepper;
