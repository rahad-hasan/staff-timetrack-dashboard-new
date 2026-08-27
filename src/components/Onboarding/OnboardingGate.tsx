"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useLogInUserStore } from "@/store/logInUserStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { resumePoint, useOnboardingStore } from "@/store/onboardingStore";
import { checklistProgress, stepsForTour } from "@/lib/onboarding/registry";
import { useTourTarget } from "@/lib/onboarding/useTourTarget";
import { useDialogOpen } from "@/lib/onboarding/useDialogOpen";
import OnboardingModal from "./OnboardingModal";
import SpotlightOverlay from "./SpotlightOverlay";
import TooltipPopover from "./TooltipPopover";
import ChecklistWidget from "./ChecklistWidget";
import TourHandoffDialog from "./TourHandoffDialog";

/**
 * The single mounted orchestrator for everything onboarding — the counterpart
 * to `BillingGate`, and mounted beside it in `(main_layout)/layout.tsx`.
 *
 * It owns the decisions; the four presentational components own the pixels:
 *   - when the welcome modal may open at all (Phase 1)
 *   - driving the active tour: navigating to a step's route, waiting for the
 *     anchor to mount, skipping a step whose anchor never arrives
 *   - the hand-off from the core walkthrough to the full dashboard tour
 *   - when the checklist is worth showing
 */

interface OnboardingGateProps {
  /**
   * Read server-side from `getDecodedUser()` and passed in.
   *
   * Not taken from `logInUserStore` alone on purpose: that store is
   * localStorage-backed and is `{}` on a fresh browser, a private window, or
   * after site data is cleared — all states in which the user still has valid
   * cookies and a working dashboard. Role decides which tasks and steps even
   * exist, so getting it wrong means showing an admin an employee's checklist.
   */
  role?: string;
}

export default function OnboardingGate({ role: serverRole }: OnboardingGateProps) {
  const router = useRouter();
  const pathname = usePathname();

  const logInUserData = useLogInUserStore((state) => state.logInUserData);
  const role = serverRole ?? (logInUserData?.role as string | undefined);

  const status = useOnboardingStore((s) => s.status);
  const loaded = useOnboardingStore((s) => s.loaded);
  const fetchStatus = useOnboardingStore((s) => s.fetchStatus);
  const welcomeOpen = useOnboardingStore((s) => s.welcomeOpen);
  const openWelcome = useOnboardingStore((s) => s.openWelcome);
  const activeTour = useOnboardingStore((s) => s.activeTour);
  const steps = useOnboardingStore((s) => s.steps);
  const stepIndex = useOnboardingStore((s) => s.stepIndex);
  const startTour = useOnboardingStore((s) => s.startTour);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const goToStep = useOnboardingStore((s) => s.goToStep);
  const endTour = useOnboardingStore((s) => s.endTour);
  const dismiss = useOnboardingStore((s) => s.dismiss);
  const finish = useOnboardingStore((s) => s.finish);
  const checklistExpanded = useOnboardingStore((s) => s.checklistExpanded);
  const setChecklistExpanded = useOnboardingStore((s) => s.setChecklistExpanded);

  const setRole = useOnboardingStore((s) => s.setRole);

  const [handoffOpen, setHandoffOpen] = useState(false);

  /**
   * A dialog opened *during* a step (the user clicking the very button the
   * tour highlighted) must not be buried under the backdrop — see
   * `useDialogOpen`. The tour keeps its place and comes back on close.
   */
  const dialogOpen = useDialogOpen();

  /**
   * The welcome modal opens at most once per page load. Without this a user
   * who closes it and then navigates would meet it again on the next route,
   * because the server state that triggered it has not changed yet.
   */
  const welcomeShownRef = useRef(false);

  const step = activeTour ? steps[stepIndex] : undefined;

  /* ---------------- load ---------------- */

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    setRole(role);
  }, [role, setRole]);

  /* ---------------- Phase 1: auto-trigger ---------------- */

  useEffect(() => {
    if (!loaded || !status || welcomeShownRef.current) return;
    if (activeTour) return;

    // All three conditions, plus a real role to build a tour from.
    const eligible =
      status.isNewUser &&
      !status.isOnboardingCompleted &&
      !status.isDismissed &&
      Boolean(role);

    // Only ambush them on the dashboard. Someone who deep-linked into a report
    // came for the report.
    if (!eligible || !pathname?.startsWith("/dashboard")) return;

    welcomeShownRef.current = true;
    openWelcome();
  }, [loaded, status, activeTour, role, pathname, openWelcome]);

  /* ---------------- navigate to the step's route ---------------- */

  useEffect(() => {
    if (!step?.route || !pathname) return;
    if (pathname === step.route) return;

    router.push(step.route);
  }, [step?.route, pathname, router]);

  /**
   * Expand the nav group a step's target lives inside.
   *
   * `setOpenMenu` TOGGLES (`sidebarStore.ts`), so firing it blindly on an
   * already-open menu closes the very thing the step needs. Check first.
   */
  useEffect(() => {
    if (!step?.expandsNavMenu) return;

    const { openMenu, setOpenMenu } = useSidebarStore.getState();
    if (openMenu !== step.expandsNavMenu) setOpenMenu(step.expandsNavMenu);
  }, [step?.expandsNavMenu, pathname]);

  /* ---------------- resolve the target ---------------- */

  // Suspend targeting while a route change is in flight: the previous page's
  // anchors are still mounted for a frame or two and would be spotlighted.
  const onRoute = !step?.route || pathname === step.route;
  const target = useTourTarget(step && onRoute ? step.target : null);

  /**
   * A step whose anchor never arrives is skipped rather than left spotlighting
   * nothing. This is not hypothetical — the Add Project button only renders
   * for admins and managers, and the whole desktop sidebar is `display:none`
   * below the `lg` breakpoint, so on a phone every nav step legitimately has
   * no target.
   */
  useEffect(() => {
    if (!activeTour || target.status !== "missing") return;

    if (stepIndex >= steps.length - 1) {
      endTour({ completed: false });
      return;
    }

    nextStep();
  }, [target.status, activeTour, stepIndex, steps.length, nextStep, endTour]);

  /* ---------------- completion ---------------- */

  const progress = checklistProgress(role, status?.completedSteps ?? []);

  // Every task done is the real definition of "onboarded", whether they got
  // there via the tour or just by using the product.
  useEffect(() => {
    if (!status || status.isOnboardingCompleted) return;
    if (progress.total === 0 || progress.done < progress.total) return;

    void finish();
  }, [status, progress.total, progress.done, finish]);

  /* ---------------- handlers ---------------- */

  const handleNext = useCallback(() => {
    const isLast = stepIndex >= steps.length - 1;

    if (!isLast) {
      nextStep();
      return;
    }

    const finishedTour = activeTour;
    endTour({ completed: true });

    // Finishing the core walkthrough offers the A-to-Z dashboard tour rather
    // than launching straight into it — six more steps without being asked is
    // how a helpful tour becomes an obstacle.
    if (finishedTour === "core") setHandoffOpen(true);
    // An orientation-only run (employee, project_manager) has no hand-off —
    // endTour already marked the whole onboarding complete.
  }, [stepIndex, steps.length, nextStep, endTour, activeTour]);

  const handleSkipTour = useCallback(() => {
    endTour({ completed: false });
  }, [endTour]);

  /**
   * Which walkthrough this role should actually get.
   *
   * Every core step targets a CTA that only management roles can see — an
   * employee or project_manager has zero of them, and `startTour` bails on an
   * empty step list. Without this, "Start interactive setup" is a button that
   * does nothing for them. They get the dashboard orientation instead, which
   * is the part of the tour that was always meant for everyone.
   */
  const openingTour = useCallback(
    () => (stepsForTour("core", role).length > 0 ? "core" : "orientation"),
    [role],
  );

  const handleStartCore = useCallback(() => {
    startTour(openingTour(), role);
  }, [startTour, role, openingTour]);

  const handleResume = useCallback(() => {
    const point = resumePoint(status);
    if (point) startTour(point.tour, role, point.index);
    else startTour(openingTour(), role);
  }, [status, role, startTour, openingTour]);

  const handleStartOrientation = useCallback(() => {
    setHandoffOpen(false);
    startTour("orientation", role);
  }, [startTour, role]);

  const handleDeclineOrientation = useCallback(() => {
    setHandoffOpen(false);
    void finish();
  }, [finish]);

  /* ---------------- render ---------------- */

  if (!loaded || !status) return null;

  const resumable = resumePoint(status) !== null;

  const showChecklist =
    !status.isOnboardingCompleted &&
    !status.isDismissed &&
    progress.total > 0 &&
    progress.done < progress.total;

  return (
    <>
      <OnboardingModal
        open={welcomeOpen}
        userName={logInUserData?.name as string | undefined}
        canResume={resumable}
        onStart={handleStartCore}
        onResume={handleResume}
        onSkip={() => void dismiss()}
      />

      <TourHandoffDialog
        open={handoffOpen}
        stepCount={stepsForTour("orientation", role).length}
        onAccept={handleStartOrientation}
        onDecline={handleDeclineOrientation}
      />

      {activeTour && step && !dialogOpen && (
        <>
          <SpotlightOverlay
            rect={target.rect}
            padding={step.padding ?? 8}
            radius={step.radius}
          />

          {/*
            Rendered only once the target is measured. Floating-ui needs a real
            reference element to place against, and a bubble that appears
            mid-screen and then jumps to the target reads as a glitch.
          */}
          {target.status === "found" && (
            <TooltipPopover
              step={step}
              element={target.element}
              index={stepIndex}
              total={steps.length}
              taskDone={
                step.task ? status.completedSteps.includes(step.task) : false
              }
              onNext={handleNext}
              onPrev={prevStep}
              onSkip={handleSkipTour}
              onJump={goToStep}
            />
          )}
        </>
      )}

      <AnimatePresence>
        {showChecklist && (
          <ChecklistWidget
            key="checklist"
            tasks={progress.tasks}
            completed={status.completedSteps}
            expanded={checklistExpanded}
            onExpandedChange={setChecklistExpanded}
            onDismiss={() => void dismiss()}
            onStartTour={handleStartCore}
          />
        )}
      </AnimatePresence>
    </>
  );
}
