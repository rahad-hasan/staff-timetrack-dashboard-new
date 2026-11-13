"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLogInUserStore } from "@/store/logInUserStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { resumePoint, useOnboardingStore } from "@/store/onboardingStore";
import { checklistProgress, stepsForTour } from "@/lib/onboarding/registry";
import { useTourTarget } from "@/lib/onboarding/useTourTarget";
import { useDialogOpen } from "@/lib/onboarding/useDialogOpen";
import { useLatched } from "@/lib/onboarding/useLatched";
import { useQuickActionStore } from "@/store/quickActionStore";
import { IOnboardingStatus, IOnboardingTask } from "@/types/onboarding";
import OverlayErrorBoundary from "@/components/Common/OverlayErrorBoundary";

/*
 * The four presentational overlays are loaded on demand. They exist for a new
 * user's first sessions, yet were in the bundle every dashboard page loads —
 * along with framer-motion, which all of them animate with. Now each chunk is
 * fetched the first time its overlay is needed (warmed early while onboarding
 * is in progress — see the preload effect) and stays mounted once shown, so
 * the gate itself imports neither them nor framer-motion.
 */
const QuickSetupDialog = dynamic(() => import("./QuickSetupDialog"), {
  ssr: false,
});
const TourHandoffDialog = dynamic(() => import("./TourHandoffDialog"), {
  ssr: false,
});
const SpotlightOverlay = dynamic(() => import("./SpotlightOverlay"), {
  ssr: false,
});
const TooltipPopover = dynamic(() => import("./TooltipPopover"), {
  ssr: false,
});
const ChecklistWidget = dynamic(() => import("./ChecklistWidget"), {
  ssr: false,
});

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
  /**
   * `GET /user/onboarding-status` as the layout read it in this server render
   * (null when that read failed) — seeds the store, see the load effect.
   */
  initialStatus?: IOnboardingStatus | null;
}

export default function OnboardingGate({
  role: serverRole,
  workspaceName,
  initialStatus,
}: OnboardingGateProps) {
  const router = useRouter();
  const pathname = usePathname();

  const logInUserData = useLogInUserStore((state) => state.logInUserData);
  const role = serverRole ?? (logInUserData?.role as string | undefined);

  const status = useOnboardingStore((s) => s.status);
  const loaded = useOnboardingStore((s) => s.loaded);
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
   * Set when a lazy overlay failed to load (see OverlayErrorBoundary): from
   * then on, until the next full page load, nothing below renders.
   */
  const [overlaysFailed, setOverlaysFailed] = useState(false);

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

  /**
   * Seed the store from the status the layout read during the server render,
   * instead of asking again through a server action on every full load — a
   * POST that waits in line behind every other action the tab sends, while
   * the checklist and welcome modal wait on it.
   *
   * Only ever into a store that holds no status yet: a first load, a store
   * reset at sign-out, or a first read that failed (a later render's snapshot
   * then heals it with no request of its own). A store that has a status is
   * the truth — it carries optimistic ticks and the live tour position — and
   * the fresh snapshot every refresh of the layout hands down would roll them
   * back. Explicit refreshes stay `fetchStatus({ force: true })`.
   */
  useEffect(() => {
    const store = useOnboardingStore.getState();
    if (store.status) return;

    if (initialStatus) {
      useOnboardingStore.setState({ status: initialStatus, loaded: true });
    } else if (!store.loaded && !store.inFlight) {
      // The server read failed — try once from the client, so the gate still
      // settles (`loaded`) instead of waiting for the next server render.
      // `fetchStatus` reads through a GET route handler: a server action sent
      // from here, beside live views that failed in the same render, crashed
      // the app at their next retry (React #310).
      void store.fetchStatus();
    }
  }, [initialStatus]);

  useEffect(() => {
    setRole(role);
  }, [role, setRole]);

  /* ---------------- Phase 1: auto-trigger ---------------- */

  useEffect(() => {
    if (!loaded || !status || welcomeShownRef.current) return;
    // Nobody asked for it: no error toast for a guide that cannot render.
    if (activeTour || overlaysFailed) return;

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
  }, [loaded, status, activeTour, overlaysFailed, role, pathname, openWelcome]);

  /* ---------------- overlays that cannot load ---------------- */

  /**
   * With the overlays gone, a running tour is invisible but not idle: it
   * would keep sending the user back to its step's page on every navigation,
   * with no spotlight, tooltip or exit on screen. So whenever something asks
   * for an overlay that can no longer render — the tour or guide that was up
   * when the chunk failed, or a later "Restart tour" from the profile menu —
   * end or close it straight away (through the store's own actions, so the
   * resume point is saved as on any exit) and say why.
   */
  useEffect(() => {
    if (!overlaysFailed || !(activeTour || welcomeOpen || handoffOpen)) return;

    toast.error(
      activeTour
        ? "The product tour couldn't load"
        : "The setup guide couldn't load",
      {
        id: "onboarding-overlays-failed",
        description: "Reload the page to try again.",
        action: { label: "Reload", onClick: () => window.location.reload() },
      },
    );
    if (activeTour) endTour({ completed: false });
    if (welcomeOpen) closeWelcome();
    if (handoffOpen) setHandoffOpen(false);
  }, [overlaysFailed, activeTour, welcomeOpen, handoffOpen, endTour, closeWelcome]);

  const handleOverlayError = useCallback(() => setOverlaysFailed(true), []);

  /* ---------------- navigate to the step's route ---------------- */

  useEffect(() => {
    // A tour that cannot render must not drive navigation (see above).
    if (overlaysFailed) return;
    if (!step?.route || !pathname) return;
    if (pathname === step.route) return;

    router.push(step.route);
  }, [step?.route, pathname, router, overlaysFailed]);

  /**
   * Expand the nav group a step's target lives inside.
   *
   * `setOpenMenu` TOGGLES (`sidebarStore.ts`), so firing it blindly on an
   * already-open menu closes the very thing the step needs. Check first.
   */
  useEffect(() => {
    if (overlaysFailed || !step?.expandsNavMenu) return;

    const { openMenu, setOpenMenu } = useSidebarStore.getState();
    if (openMenu !== step.expandsNavMenu) setOpenMenu(step.expandsNavMenu);
  }, [step?.expandsNavMenu, pathname, overlaysFailed]);

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
    // Nor a guide that can no longer render (an error toast nobody asked for).
    if (
      status.isDismissed ||
      status.isOnboardingCompleted ||
      activeTour ||
      overlaysFailed
    ) {
      return;
    }

    openWelcome();
  }, [pendingTask, status, dialogOpen, activeTour, overlaysFailed, openWelcome, setPendingTask]);

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

  /* ---------------- lazy overlays ---------------- */

  const showChecklist = Boolean(
    status &&
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
      !welcomeOpen,
  );

  // Each lazy overlay mounts the first time it is needed and then stays
  // mounted, so closing it still animates out (and Radix still returns focus).
  const welcomeMounted = useLatched(welcomeOpen);
  const handoffMounted = useLatched(handoffOpen);
  const checklistMounted = useLatched(showChecklist);

  /**
   * Warm the guide and tour chunks while onboarding is in progress — the only
   * sessions in which they can open — so the first guide, spotlight or
   * hand-off never waits on a download. (The checklist loads by being shown.)
   * Completed and dismissed accounts never fetch any of them; a restart from
   * the profile menu loads them on demand.
   */
  const onboardingInProgress = Boolean(
    status && !status.isOnboardingCompleted && !status.isDismissed,
  );

  useEffect(() => {
    if (!onboardingInProgress) return;

    // A failed warm-up is harmless: the overlay's own load retries the chunk.
    const ignore = () => undefined;
    import("./QuickSetupDialog").catch(ignore);
    import("./SpotlightOverlay").catch(ignore);
    import("./TooltipPopover").catch(ignore);
    import("./TourHandoffDialog").catch(ignore);
  }, [onboardingInProgress]);

  /* ---------------- render ---------------- */

  if (!loaded || !status) return null;

  const resumable = resumePoint(status) !== null;

  return (
    <OverlayErrorBoundary label="onboarding" onError={handleOverlayError}>
      {welcomeMounted && (
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
      )}

      {handoffMounted && (
        <TourHandoffDialog
          open={handoffOpen}
          stepCount={stepsForTour("orientation", role).length}
          onAccept={handleStartOrientation}
          onDecline={handleDeclineOrientation}
        />
      )}

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

      {checklistMounted && (
        <ChecklistWidget
          visible={showChecklist}
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
    </OverlayErrorBoundary>
  );
}
