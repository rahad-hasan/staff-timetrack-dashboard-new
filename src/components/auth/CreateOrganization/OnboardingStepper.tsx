"use client";

import { cn } from "@/lib/utils";

interface OnboardingStepperProps {
  steps: ReadonlyArray<{ id: string; title: string }>;
  activeIndex: number;
}

/** Simple horizontal progress bar for the onboarding wizard. */
const OnboardingStepper = ({
  steps,
  activeIndex,
}: OnboardingStepperProps) => {
  const progress =
    steps.length <= 1
      ? 100
      : ((activeIndex + 1) / steps.length) * 100;

  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-[#f2f7fe]"
      role="progressbar"
      aria-label="Setup progress"
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={activeIndex + 1}
    >
      <div
        className={cn(
          "h-full rounded-full bg-[linear-gradient(90deg,#427fe3,#3360c8)] dark:bg-[linear-gradient(90deg,#427fe3,#3360c8)] transition-all duration-300 ease-in-out",
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default OnboardingStepper;
