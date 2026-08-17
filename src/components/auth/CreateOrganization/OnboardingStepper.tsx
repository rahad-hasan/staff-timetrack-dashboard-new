"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface OnboardingStepperProps {
  steps: ReadonlyArray<{ id: string; title: string }>;
  activeIndex: number;
}

/** Compact progress rail for the create-organization wizard. */
const OnboardingStepper = ({ steps, activeIndex }: OnboardingStepperProps) => (
  <ol className="flex items-center gap-2" aria-label="Setup progress">
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

export default OnboardingStepper;
