"use client";

import {
  startTransition,
  useEffect,
  useReducer,
  useTransition,
  type TransitionStartFunction,
} from "react";
import { useRouter } from "next/navigation";
import {
  checkBeforeRefresh,
  NUDGE_EVERY_MS,
  nudgeWhilePending,
  recoveryCycle,
} from "@/hooks/useLiveRefresh";

type AppRouter = ReturnType<typeof useRouter>;

/** Between automatic retries: quick for a blip, then once a minute for as long as it takes. */
const RETRY_DELAYS_MS = [15_000, 30_000, 60_000];
/** Back on screen, or back online: retry after this, once the network has settled. */
const WAKE_DELAY_MS = 3_000;
/** How long an unsettled retry holds back automatic ones: one backoff step (see lastRetry). */
const RETRY_IN_FLIGHT_MS = RETRY_DELAYS_MS[0];
/** How long an unsettled retry is nudged at most: the longest step, when the next is due anyway. */
const RETRY_WATCH_MAX_MS = RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];

/*
 * Automatic recovery for route error boundaries on pages that refresh
 * themselves in the background (dashboard, timesheets, activity).
 *
 * Next clears an error boundary only on `reset()` or a pathname change. A
 * live refresh changes neither, so without this a panel knocked out by one
 * failed background read (an API restart during a deploy, a timeout) kept its
 * "Something Went Wrong" over the fresh data every later refresh fetched,
 * until someone clicked. Retry needs both halves in one transition:
 * `router.refresh()` re-runs the server components, where the failed read
 * lives (`reset()` alone re-renders the same failed payload), and `reset()`
 * lets the fresh payload show; the transition commits them together.
 *
 * Module-level and single-flight: a refresh re-renders every segment, so one
 * per retry serves every failed boundary on the page — N failed panels must
 * not cost N refreshes. Only while the tab is visible and online, and only
 * after the same check live refresh makes (`checkBeforeRefresh`): an
 * unattended refresh that cannot reach the server turns into a full-page
 * error, not a quiet retry.
 */
interface FailedPanel {
  reset: () => void;
  /** Re-renders the panel's fallback: an update for React to process (see watchRetry). */
  nudge: () => void;
}

const failedPanels = new Set<FailedPanel>();
let recoveryRouter: AppRouter | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryCheck: AbortController | null = null;
let attempt = 0;
/*
 * Whether a cycle runs is `recoveryCycle.active` (shared with live refresh,
 * which stands down meanwhile). A cycle outlives the fallback component that
 * started it. When a retry's refresh fails again, Next's error boundary
 * catches it anew and React REMOUNTS the fallback (a class boundary that
 * catches deletes its committed children): the old fallback's cleanup runs,
 * then the new one's mount, in the same commit. Ending the cycle in that
 * cleanup reset the backoff to 15 s on every failed retry — an outage cost
 * every open tab a full-route render each 15 s instead of backing off to once
 * a minute. So a leave only ends the cycle once the commit has settled with no
 * failed panel left (a microtask later).
 */
/**
 * The last retry dispatched, until it settles: as a remount (failed again:
 * joinRecovery) or an unmount (recovered: the cycle ends). Its watch nudges
 * React meanwhile (see watchRetry). For its first RETRY_IN_FLIGHT_MS it also
 * counts as in flight, and an automatic tick that finds it so (a wake tick, or
 * the scheduled one after a Try again) stands down instead of doubling it.
 * No longer than that, so a retry that never settles costs at most one
 * backoff step; a hanging backend gets one refresh per step, as an outage does.
 */
let lastRetry: { at: number; stopWatch: () => void } | null = null;

const nextDelay = () => RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];

const retryInFlight = () =>
  lastRetry !== null && Date.now() - lastRetry.at < RETRY_IN_FLIGHT_MS;

function clearRetryTimer() {
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function scheduleRetry(delay: number) {
  clearRetryTimer();
  if (failedPanels.size === 0 || document.visibilityState !== "visible") return;
  retryTimer = setTimeout(autoRetry, delay);
}

/** Refresh the route and clear every failed boundary, in one transition; then watch it settle. */
function refreshFailedPanels(
  router: AppRouter,
  start: TransitionStartFunction,
  also?: () => void,
) {
  const resets = new Set([...failedPanels].map((panel) => panel.reset));
  if (also) resets.add(also);
  start(() => {
    router.refresh();
    for (const reset of resets) reset();
  });
  watchRetry();
}

/**
 * Until the retry just dispatched settles, nudge React (nudgeWhilePending)
 * by re-rendering one fallback, whose output does not change.
 *
 * Its transition can park with the API healthy on a dropped ping: the card
 * stayed up until some unrelated update (60-100 s), and Try again stalled the
 * same way. The parked row can be any on the page (seen: the screenshot
 * grid's, not the failed panel's), so resetting the boundary after the
 * refresh commits would not avoid it. The data can land long after the
 * dispatch (a slow read), so the watch lasts until the retry settles, the
 * next one replaces it, or RETRY_WATCH_MAX_MS has passed.
 */
function watchRetry() {
  stopRetryWatch();
  const stopWatch = nudgeWhilePending(
    () => {
      for (const panel of failedPanels) {
        panel.nudge();
        break;
      }
    },
    NUDGE_EVERY_MS,
    RETRY_WATCH_MAX_MS,
  );
  lastRetry = { at: Date.now(), stopWatch };
}

function stopRetryWatch() {
  if (lastRetry !== null) {
    lastRetry.stopWatch();
    lastRetry = null;
  }
}

async function autoRetry() {
  retryTimer = null;
  if (failedPanels.size === 0 || retryCheck) return;
  if (document.visibilityState !== "visible") return; // onWake resumes
  if (navigator.onLine === false || retryInFlight()) {
    // "online" resumes (this re-check covers a browser that never sends it),
    // and a retry still settling (Try again's) stands in for this one.
    scheduleRetry(nextDelay());
    return;
  }

  const controller = new AbortController();
  retryCheck = controller;
  const verdict = await checkBeforeRefresh(controller.signal);
  retryCheck = null;
  if (controller.signal.aborted || failedPanels.size === 0) return;
  // A new build: reloaded, or the user was asked — a refresh would hard-reload.
  if (verdict === "stop") {
    endRecovery();
    return;
  }

  const router = recoveryRouter;
  // Try again may have dispatched one while the check ran.
  if (
    verdict === "refresh" &&
    router &&
    document.visibilityState === "visible" &&
    !retryInFlight()
  ) {
    refreshFailedPanels(router, startTransition);
  }
  // Scheduled either way: boundaries that recover leave, and the last to
  // leave ends the cycle; any that fail again are caught again and stay.
  attempt += 1;
  scheduleRetry(nextDelay());
}

function onWake() {
  if (failedPanels.size === 0) return;
  if (document.visibilityState !== "visible") {
    clearRetryTimer();
    return;
  }
  if (!retryCheck) scheduleRetry(WAKE_DELAY_MS);
}

function joinRecovery(panel: FailedPanel, router: AppRouter) {
  recoveryRouter = router;
  failedPanels.add(panel);
  // A (re)mount means the last retry has settled — here, by failing again.
  stopRetryWatch();
  if (!recoveryCycle.active) {
    recoveryCycle.active = true;
    attempt = 0;
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("online", onWake);
    scheduleRetry(nextDelay());
  }
  // Otherwise the cycle carries on: its scheduled retry and its backoff stay.
  return () => {
    failedPanels.delete(panel);
    // Decide after the commit: a remount re-joins before this runs.
    queueMicrotask(() => {
      if (failedPanels.size === 0) endRecovery();
    });
  };
}

function endRecovery() {
  recoveryCycle.active = false;
  stopRetryWatch();
  clearRetryTimer();
  retryCheck?.abort();
  retryCheck = null;
  attempt = 0;
  document.removeEventListener("visibilitychange", onWake);
  window.removeEventListener("online", onWake);
}

/**
 * Enrols a route error boundary in automatic recovery (15s, 30s, then every
 * minute while visible). `retry` does the same at once — for every failed
 * boundary on the page, since one refresh re-renders them all.
 */
export function useErrorAutoRecovery(reset: () => void) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();
  const [, nudge] = useReducer((renders: number) => renders + 1, 0);

  useEffect(() => joinRecovery({ reset, nudge }, router), [reset, router]);

  const retry = () => {
    if (retrying) return;
    startRetry(async () => {
      // The question every automatic retry asks first. With the server
      // unreachable (a deploy restarting it, the network gone), Next turns a
      // refresh into a hard navigation onto the proxy's or the browser's
      // error page. The card stays instead, and the automatic cycle goes on.
      if ((await checkBeforeRefresh()) !== "refresh") return;
      refreshFailedPanels(router, startRetry, reset);
    });
  };

  return { retry, retrying };
}
