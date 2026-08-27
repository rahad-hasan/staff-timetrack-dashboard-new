"use client";

import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { PopoverClose } from "@/components/ui/popover";
import { resumePoint, useOnboardingStore } from "@/store/onboardingStore";

/**
 * "Resume / Restart product tour" in the profile popover — the escape hatch
 * that makes skipping safe. Without it, "Skip for now" is a one-way door.
 *
 * Wrapped in `PopoverClose` because the popover would otherwise stay open
 * underneath the spotlight, and the first thing the tour does is dim and
 * blur everything that is not the current target — including the menu the
 * click came from.
 *
 * The tour needs the dashboard's anchors, so this navigates there first when
 * the user is somewhere else. Steps that carry their own `route` take it from
 * there.
 */
export default function TourMenuItem({ className }: { className: string }) {
  const router = useRouter();
  const status = useOnboardingStore((state) => state.status);
  const restart = useOnboardingStore((state) => state.restart);
  const startTour = useOnboardingStore((state) => state.startTour);
  // Seeded server-side by OnboardingGate, so this is correct even when
  // localStorage is empty.
  const role = useOnboardingStore((state) => state.role);

  const point = resumePoint(status);
  const canResume = point !== null && !status?.isOnboardingCompleted;

  const handleClick = () => {
    router.push("/dashboard");

    if (canResume && point) startTour(point.tour, role, point.index);
    else void restart();
  };

  return (
    <PopoverClose asChild>
      <button type="button" onClick={handleClick} className={className}>
        <Compass size={18} />
        {canResume ? "Resume product tour" : "Restart product tour"}
      </button>
    </PopoverClose>
  );
}
