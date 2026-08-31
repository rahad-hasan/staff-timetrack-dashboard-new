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
import { useQuickActionStore } from "@/store/quickActionStore";
import { IOnboardingTask } from "@/types/onboarding";
import QuickSetupDialog from "./QuickSetupDialog";
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
  /**
   * The organization's name, for Quick Setup's workspace row. Read
   * server-side for the same reason as `role`: no client store holds it —
   * `buildLogInUserData` keeps `company_id` and drops the name — so the only
   * source that works on a fresh browser is a prop from the layout.
   */
  workspaceName?: string;
}

export default function OnboardingGate({
  role: serverRole,
  workspaceName,
}: OnboardingGateProps) {
  const router = useRouter();
  const pathname = usePathname();

  const logInUserData = useLogInUserStore((state) => state.logInUserData);
  const role = serverRole ?? (logInUserData?.role as string | undefined);

  const status = useOnboardingStore((s) => s.status);
  const loaded = useOnboardingStore((s) => s.loaded);
  const fetchStatus = useOnboardingStore((s) => s.fetchStatus);
  const welcomeOpen = useOnboardingStore((s) => s.welcomeOpen);
  const openWelcome = useOnboardingStore((s) => s.openWelcome);
  const closeWelcome = useOnboardingStore((s) => s.closeWelcome);
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
  const pendingTask = useOnboardingStore((s) => s.pendingTask);
  const setPendingTask = useOnboardingStore((s) => s.setPendingTask);
  const checklistExpanded = useOnboardingStore((s) => s.checklistExpanded);
  const setChecklistExpanded = useOnboardingStore((s) => s.setChecklistExpanded);

  const setRole = useOnboardingStore((s) => s.setRole);

  /**
   * Carries "and open the create dialog when you land" across the navigation
   * a CTA kicks off — see `quickActionStore`.
   */
  const requestCreate = useQuickActionStore((s) => s.requestCreate);

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

    // A user with real progress has already met the guide and knows where it
    // lives — the floating checklist carries it from here. Auto-opening a
    // modal over every login until the list is finished is how a helpful
    // guide becomes a nag.
    if (checklistProgress(role, status.completedSteps).done > 0) return;

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
  const target = useTourTarget(step && onRoute ? step.target : null, {
    timeoutMs: step?.targetTimeoutMs,
  });

  /**
   * A step whose anchor never arrives is skipped rather than left spotlighting
   * nothing. This is not hypothetical — the Add Project button only renders
   * for admins and managers, and the whole desktop sidebar is `display:none`
   * below the `lg` breakpoint, so on a phone every nav step legitimately has
   * no target.
   */
  // Narrowed out of the union so the effect below can depend on it without
  // re-running on every measured frame of a "found" target.
  const missingAnchor = target.status === "missing" ? target.anchor : null;

  useEffect(() => {
    if (!activeTour || missingAnchor === null) return;

    // A missing verdict is only actionable for the step it was issued for.
    // After a skip, this effect re-runs with the NEW step while the target
    // state is still the old step's "missing" for one commit — acting on it
    // would cascade past steps that were never searched.
    if (missingAnchor !== step?.target) return;

    if (stepIndex >= steps.length - 1) {
      // The last step counts as reached even when its anchor never resolves.
      // By this point the tour has already navigated to the step's route (the
      // finale is the /download page itself), so ending "not completed" would
      // strand the user with a checklist that nags about the tour forever and
      // a CTA that can only restart it from scratch. Grade it done instead.
      endTour({ completed: true });
      return;
    }

    nextStep();
  }, [missingAnchor, step?.target, activeTour, stepIndex, steps.length, nextStep, endTour]);

  /**
   * Escape always ends a running tour. The tooltip's ✕ is the only pointer
   * exit, and it does not exist while a target is still being searched — on
   * the finale that window can stretch to the release fetch's whole budget,
   * with the scrim swallowing every click. A keyboard exit must not depend on
   * any tour UI being on screen. Suspended while a dialog is open: Escape
   * there belongs to the dialog, and the tour is already standing aside.
   */
  useEffect(() => {
    if (!activeTour || dialogOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // A Radix layer that consumed this Escape (the theme dropdown, the
      // profile popover — both spotlighted and opened mid-step by design)
      // calls preventDefault while closing itself. That Escape closed a menu;
      // it must not also kill the tour.
      if (event.defaultPrevented) return;
      if (event.key === "Escape") endTour({ completed: false });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTour, dialogOpen, endTour]);

  /* ---------------- come back after a CTA ---------------- */

  /**
   * A Quick Setup CTA closes the guide and drops the user on the page where
   * the work happens. When they actually do it, bring the guide back.
   *
   * Without this the flow dead-ends exactly where it should feel like
   * progress: the user adds their member, the success toast fades, and the
   * guide they were following is simply gone — they have to find the widget
   * and reopen it to reach the next step. Reopening lands them on the next
   * incomplete row, which is the whole point of a checklist.
   */
  useEffect(() => {
    if (!pendingTask || !status) return;
    if (!status.completedSteps.includes(pendingTask)) return;

    // Wait for the create dialog to finish unmounting. Two Radix modals
    // overlapping fight over the `pointer-events: none` they each put on
    // <body>, and the loser leaves the page inert.
    if (dialogOpen) return;

    setPendingTask(null);

    // Nothing to come back to if they turned the guide off or finished, and
    // a running tour is a deliberate full-screen flow — do not interrupt it.
    if (status.isDismissed || status.isOnboardingCompleted || activeTour) {
      return;
    }

    openWelcome();
  }, [pendingTask, status, dialogOpen, activeTour, openWelcome, setPendingTask]);

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
    // than launching straight into it — seven more steps without being asked is
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

  /**
   * The one thing every checklist CTA does, from either surface.
   *
   * It deliberately does NOT launch the spotlight walkthrough. The centered
   * guide *is* the tour: the user watches the clip for the step, presses the
   * one button, and lands on the page **with the create dialog already open**
   * — then the milestone ticks itself from that flow's own success handler.
   * Hijacking the click into an anchored, seven-step overlay is the thing that
   * made the old onboarding feel like an obstacle. The spotlight tour survives
   * as an explicit opt-in: the "Finish the product tour" row, and
   * Resume/Restart in the profile menu.
   *
   * Order matters. The intent is raised BEFORE the navigation so it is already
   * in the store when the destination's hero section mounts and claims it —
   * and before `closeWelcome`, so that a CTA pressed while already standing on
   * the destination (no navigation at all) still has something to claim.
   */
  const runTaskAction = useCallback(
    (task: IOnboardingTask, { reopenGuide }: { reopenGuide: boolean }) => {
      if (task.id === "TOUR_COMPLETED") {
        // Resume a half-finished walkthrough or start the right one for this
        // role. `startTour` closes this dialog itself.
        handleResume();
        return;
      }

      if (task.createIntent) requestCreate(task.createIntent);

      // Breadcrumb for the effect above: when this milestone really lands, the
      // guide comes back on its own. Only for CTAs pressed *inside* the guide
      // — reopening a dialog the user never had open is an ambush, not a
      // hand-off.
      if (reopenGuide) setPendingTask(task.id);

      closeWelcome();
      router.push(task.href);
    },
    [closeWelcome, router, handleResume, setPendingTask, requestCreate],
  );

  const handleQuickSetupAction = useCallback(
    (task: IOnboardingTask) => runTaskAction(task, { reopenGuide: true }),
    [runTaskAction],
  );

  const handleChecklistAction = useCallback(
    (task: IOnboardingTask) => runTaskAction(task, { reopenGuide: false }),
    [runTaskAction],
  );

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
    progress.done < progress.total &&
    // The widget is the dialog's own launcher and sits at z-[80], above
    // ui/dialog's z-50 overlay. Left mounted it would float brightly over the
    // guide it just opened — and because Radix puts `pointer-events: none` on
    // the body, a click on that bright card lands on the overlay and closes
    // the very dialog the user opened. It is also redundant: the dialog shows
    // the same checklist, larger.
    !welcomeOpen;

  return (
    <>
      <QuickSetupDialog
        open={welcomeOpen}
        userName={logInUserData?.name as string | undefined}
        workspaceName={workspaceName}
        tasks={progress.tasks}
        completed={status.completedSteps}
        tourResumable={resumable}
        onClose={closeWelcome}
        onDismissForever={() => void dismiss()}
        onAction={handleQuickSetupAction}
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
            onTaskAction={handleChecklistAction}
            onStartTour={handleStartCore}
            onOpenGuide={openWelcome}
          />
        )}
      </AnimatePresence>
    </>
  );
}
