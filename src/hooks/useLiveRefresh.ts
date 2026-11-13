"use client";

import { useEffect, useReducer, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import { toast } from "sonner";

/* ------------------------------------------------------------------ *
 * Is a background refresh safe right now?
 * (Shared with the dashboard's error boundary, which retries on its own.)
 * ------------------------------------------------------------------ */

/** The build this bundle was compiled in (next.config.ts); "" if it set none. */
const CLIENT_BUILD_STAMP = process.env.NEXT_PUBLIC_BUILD_STAMP ?? "";

const PING_URL = "/api/live-ping";
/** Far beyond a healthy answer from a route that does nothing; short enough not to stall a tick. */
const PING_TIMEOUT_MS = 5_000;
/** sessionStorage: the server build this tab last reloaded itself onto. */
const RELOAD_GUARD_KEY = "stafftime-live-reload";
const NEW_BUILD_TOAST_ID = "live-refresh-new-build";

/** Cleared if this tab proves its stamps cannot tell builds apart (see onNewBuild). */
let stampsComparable = true;
/** Set once a new build was detected: no background refresh may run again on this page. */
let newBuildDetected = false;

/**
 * - `"refresh"` — the server is up and runs this tab's build.
 * - `"retry"` — offline, or no usable answer in time: skip, try again later.
 * - `"stop"` — the server runs another build. Already dealt with (reloaded,
 *   or the user was asked); refresh no more.
 */
export type RefreshVerdict = "refresh" | "retry" | "stop";

/**
 * Whether useErrorAutoRecovery is running a recovery cycle on this page (the
 * engine owns the value). Its retries refresh the whole route at least once a
 * minute while the tab is visible, and only theirs clear the error cards, so a
 * live refresh meanwhile is a second full-route render of the same data — both
 * wake together on a return to the tab or on "online". Live refresh stands
 * down while it is set.
 */
export const recoveryCycle = { active: false };

/** How often a parked refresh transition is nudged (see nudgeWhilePending). */
export const NUDGE_EVERY_MS = 2_000;

/**
 * Calls `nudge` every `everyMs` for at most `maxMs`, to wake a router.refresh()
 * transition React has parked; returns the stop function.
 *
 * A transition that suspends under content already on screen waits for a
 * ping. A server-component row that streamed in while React yielded is still
 * unparsed, so React attaches its ping with then(), which parses the row and
 * pings at once, inside the render, where React (the 19.2 canary in Next 15.5)
 * drops it and parks the transition with the data already there and nothing
 * left to wake it. Any update makes React retry what it parked, so `nudge`
 * re-renders something whose output does not change. Seen as error cards that
 * stayed up after a healthy retry, and as a live refresh whose isPending never
 * fell, so every later tick skipped and the page stopped updating.
 */
export function nudgeWhilePending(
  nudge: () => void,
  everyMs: number,
  maxMs: number,
): () => void {
  const startedAt = Date.now();
  const timer = setInterval(() => {
    if (Date.now() - startedAt >= maxMs) clearInterval(timer);
    else nudge();
  }, everyMs);
  return () => clearInterval(timer);
}

/**
 * Ask before every background `router.refresh()`.
 *
 * Next 15 has no failure path for a refresh that keeps the page. When the RSC
 * fetch throws (offline, Wi-Fi still reconnecting after sleep), answers with
 * anything but a 2xx flight response (the proxy's 502 page while pm2 restarts
 * the app), or comes from another build, the router falls back to
 * `location.replace(url)`: the tab lands on the browser's offline page or the
 * proxy's 502 (which no browser retries), or reloads under whatever the user
 * was typing — with no user action behind it. So check with our own server
 * first, through a route that does nothing (GET /api/live-ping), and only
 * refresh on a 2xx from the same build. The server can still die between that
 * answer and the refresh's own fetch: a window of milliseconds instead of the
 * whole outage.
 */
export async function checkBeforeRefresh(signal?: AbortSignal): Promise<RefreshVerdict> {
  if (newBuildDetected) return "stop";
  // `false` is reliable (`true` is not — hence the ping).
  if (navigator.onLine === false) return "retry";

  const serverStamp = await pingServer(signal);
  if (serverStamp === null) return "retry";
  if (newBuildDetected) return "stop";

  // An empty stamp on either side means a build that set none: there is no
  // telling builds apart, so refresh as before the stamps existed.
  if (
    !stampsComparable ||
    !CLIENT_BUILD_STAMP ||
    !serverStamp ||
    serverStamp === CLIENT_BUILD_STAMP
  ) {
    return "refresh";
  }
  return onNewBuild(serverStamp);
}

/** Stands in for the stamp of a server whose build has no /api/live-ping. */
const ROUTE_MISSING_STAMP = "(no live-ping route)";

/** The server's build stamp, or null when no 2xx JSON answer came back in time. */
async function pingServer(signal?: AbortSignal): Promise<string | null> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  const timeout = setTimeout(abort, PING_TIMEOUT_MS);
  try {
    const res = await fetch(PING_URL, { cache: "no-store", signal: controller.signal });
    // The server answered but has no such route: it runs a build older than
    // this tab's (a rollback). That is a version change, not an outage —
    // treating it as "unreachable" would leave the tab never refreshing.
    if (res.status === 404 && !res.redirected) return ROUTE_MISSING_STAMP;
    // Only the route's own answer counts. A redirect or an HTML page (a
    // captive portal, a proxy error) means something else answered.
    if (
      !res.ok ||
      res.redirected ||
      !res.headers.get("content-type")?.includes("application/json")
    ) {
      return null;
    }
    const body: unknown = await res.json();
    const stamp =
      typeof body === "object" && body !== null
        ? (body as { stamp?: unknown }).stamp
        : undefined;
    return typeof stamp === "string" ? stamp : null;
  } catch {
    // Offline, timed out, aborted, or not JSON after all.
    return null;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

/**
 * The server runs another build, so a refresh now would make Next reload the
 * page by itself. Reload deliberately instead — but only when that loses
 * nothing: with a dialog open or focus in a field, ask once and stop.
 */
function onNewBuild(serverStamp: string): RefreshVerdict {
  let reloadedFor: string | null;
  try {
    reloadedFor = sessionStorage.getItem(RELOAD_GUARD_KEY);
  } catch {
    // Storage blocked: a reload loop would be undetectable, so never reload unasked.
    return announceNewBuild();
  }

  if (reloadedFor === serverStamp) {
    // This tab already reloaded onto exactly this build and still carries
    // another stamp: the two stamps disagree within one build (a build that
    // inlined different values), not across a deploy. Stop comparing them —
    // reloading again would only loop — and refresh as before they existed.
    stampsComparable = false;
    console.warn("[live-refresh] build stamps still differ after a reload; ignoring them");
    return "refresh";
  }

  if (isUserBusy()) return announceNewBuild();

  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, serverStamp);
  } catch {
    return announceNewBuild();
  }
  newBuildDetected = true;
  window.location.reload();
  return "stop";
}

/** One persistent toast for the page's lifetime; live refresh stays off until the reload. */
function announceNewBuild(): RefreshVerdict {
  if (!newBuildDetected) {
    newBuildDetected = true;
    toast("A new version is available", {
      id: NEW_BUILD_TOAST_ID,
      description:
        "Reload when you're ready. Until then this page won't update itself.",
      duration: Infinity,
      action: { label: "Reload", onClick: () => window.location.reload() },
    });
  }
  return "stop";
}

/** Anything a reload would destroy: an open dialog (popovers included), or focus in a field. */
function isUserBusy(): boolean {
  if (document.querySelector('[role="dialog"], [role="alertdialog"], dialog[open]')) {
    return true;
  }
  const active = document.activeElement;
  return (
    active instanceof HTMLElement &&
    (active.isContentEditable || active.matches("input, textarea, select"))
  );
}

/* ------------------------------------------------------------------ *
 * How old is what is on screen?
 * ------------------------------------------------------------------ */

/** Plenty: a refresh drops every other route's cached payload, so few renders can ever be restored. */
const REMEMBERED = 50;

/** A live page's `renderedAt` (server clock) → when this tab first showed that render (client clock). */
const firstShownAt = new Map<number, number>();

/**
 * When the content of a live page's render arrived, on THIS tab's clock.
 *
 * `renderedAt` is the page's server render time (see LiveRefresh), but it is
 * never compared with `Date.now()`: a client clock a couple of minutes off
 * the server's would call every render stale and refresh in a loop. It serves
 * as an identity. A value never shown before has just arrived from the
 * server: a load, a refresh, a revalidating action, or a link or Back the
 * router fetched. A value this tab has shown before is a render the router
 * restored from its cache — on Back/Forward, or on a link it served without a
 * fetch — and is as old as when the tab first showed it.
 */
function arrivedAt(renderedAt: number, now: number): number {
  const shownAt = firstShownAt.get(renderedAt);
  if (shownAt !== undefined) return shownAt;
  firstShownAt.set(renderedAt, now);
  if (firstShownAt.size > REMEMBERED) {
    const oldest = firstShownAt.keys().next();
    if (!oldest.done) firstShownAt.delete(oldest.value);
  }
  return now;
}

/* ------------------------------------------------------------------ *
 * The hook
 * ------------------------------------------------------------------ */

/** Back on screen, refocused or reconnected: give the network a moment before the check. */
const WAKE_DELAY_MS = 3_000;
/** After an unanswered check: quick for a blip, then patient — never later than the interval. */
const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000];

interface LiveRefreshOptions {
  intervalMs: number;
  /** The page's server render time (see LiveRefresh), used as that render's identity. */
  renderedAt: number;
}

/** One per mounted live refresh: when it last re-rendered the route, and when it will next. */
interface RefreshClock {
  /** Epoch ms of the last dispatched refresh; 0 before the first. */
  firedAt: number;
  /** Epoch ms of the next tick (now while its check runs); null while none is set (hidden tab). */
  nextAt: number | null;
}

const clocks = new Set<RefreshClock>();

/**
 * Whether a mounted live refresh re-rendered the route within the last
 * `windowMs`, or is about to within the next — a render that refreshes every
 * layout above the page too. Lets a component that polls for a layout value
 * of its own (HeaderWorkTime) hold off instead of racing that render to the
 * same number.
 */
export function isRouteRefreshNear(windowMs: number): boolean {
  const now = Date.now();
  for (const clock of clocks) {
    if (now - clock.firedAt <= windowMs) return true;
    if (clock.nextAt !== null && clock.nextAt - now <= windowMs) return true;
  }
  return false;
}

/**
 * Keeps a server-rendered page current while it is left open.
 *
 * Nothing else would: the dashboard, timesheet and activity pages are server
 * components, and the desktop tracker keeps uploading time, activity and
 * screenshots while they sit on screen. This re-renders the route with
 * `router.refresh()` every `intervalMs` — which keeps client state (open
 * popovers, sort order, half-filled forms) and, inside a transition, keeps the
 * current content up instead of flashing loading skeletons.
 *
 * - Only while the tab is visible: no timer runs in a hidden tab. Coming back
 *   (visibility, window focus, or the network returning) refreshes a few
 *   seconds later if the content is older than the interval, and otherwise
 *   resumes the countdown.
 * - Never blind: every refresh waits for `checkBeforeRefresh` — offline or
 *   unanswered means back off and retry (5s, 15s, 30s, 60s); a new build
 *   means reload (or ask) instead.
 * - Single flight: a tick is skipped while the previous refresh is still
 *   rendering, and while a navigation is in flight — a refresh dispatched then
 *   waits in the router's queue and re-renders the page the navigation just
 *   rendered.
 * - Counts from the content's real age. A fresh render (a load, a refresh, a
 *   revalidating action, a link or Back the router fetched) starts the
 *   countdown over; a page the router restored from its cache (Back/Forward,
 *   a link served without a fetch) keeps its age, so one older than the
 *   interval refreshes at once — while a quick return shows the cached page
 *   untouched. `renderedAt` (the page's own `Date.now()`) is what tells the
 *   two apart.
 *
 * Cannot see a server action in flight (Next exposes no signal for it); the
 * worst case there is one extra render, at most once per interval.
 */
function useLiveRefresh({ intervalMs, renderedAt }: LiveRefreshOptions) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // nextjs-toploader starts on every in-app link click and finishes when the
  // router commits the new URL — the app's own "navigation in flight" flag.
  // Every instance reads the same NProgress singleton, so pin the first one.
  const { isStarted } = useTopLoader();
  const [isNavigating] = useState(() => isStarted);

  const pendingRef = useRef(false);
  useEffect(() => {
    pendingRef.current = isPending;
  }, [isPending]);

  // A refresh React parked on a dropped ping keeps isPending up, and every
  // later tick stands down while it is: the page stopped updating for good.
  // Nudge it while pending, for one interval (see nudgeWhilePending); one
  // still pending after that is woken by each tick instead (see standDown).
  const [, nudge] = useReducer((renders: number) => renders + 1, 0);
  useEffect(
    () => (isPending ? nudgeWhilePending(nudge, NUDGE_EVERY_MS, intervalMs) : undefined),
    [isPending, intervalMs],
  );

  /** The render the effect below last saw, and when the content on screen arrived. */
  const renderedAtRef = useRef<number | null>(null);
  const freshAtRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    // A re-run over the same render (StrictMode's double run, a dependency
    // change) keeps its age, including a refresh dispatched since.
    if (renderedAtRef.current !== renderedAt) {
      renderedAtRef.current = renderedAt;
      freshAtRef.current = arrivedAt(renderedAt, now);
    }

    const clock: RefreshClock = { firedAt: 0, nextAt: null };
    clocks.add(clock);

    let timer: ReturnType<typeof setTimeout> | null = null;
    let check: AbortController | null = null;
    let failures = 0;
    let stopped = false;

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      clock.nextAt = null;
    };

    const schedule = (delay: number) => {
      clearTimer();
      if (stopped || newBuildDetected || document.visibilityState !== "visible") return;
      const wait = Math.max(0, delay);
      clock.nextAt = Date.now() + wait;
      timer = setTimeout(tick, wait);
    };

    const retryLater = () => {
      const delay = RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length - 1)];
      failures += 1;
      schedule(Math.min(delay, intervalMs));
    };

    /**
     * Skips this tick while a refresh, a navigation or a recovery cycle is
     * under way; true when it did. A refresh still pending a whole interval
     * later is woken again: the data can land after the nudge window (a
     * backend stall outlasting it) and still park, with no error to show.
     */
    const standDown = (): boolean => {
      if (!pendingRef.current && !isNavigating() && !recoveryCycle.active) return false;
      if (pendingRef.current) nudge();
      schedule(intervalMs);
      return true;
    };

    async function tick() {
      timer = null;
      clock.nextAt = null;
      if (stopped || check) return;
      if (standDown()) return;

      // A refresh is imminent: the header's poll holds off meanwhile.
      clock.nextAt = Date.now();
      const controller = new AbortController();
      check = controller;
      const verdict = await checkBeforeRefresh(controller.signal);
      check = null;
      clock.nextAt = null;
      if (stopped) return;

      if (verdict === "stop") return;
      if (verdict === "retry") {
        retryLater();
        return;
      }
      // What the check could not see while it ran: the tab went away (the
      // wake handler takes over on return), or a refresh, navigation or
      // recovery cycle began.
      if (document.visibilityState !== "visible") return;
      if (standDown()) return;

      failures = 0;
      clock.firedAt = freshAtRef.current = Date.now();
      startTransition(() => router.refresh());
      schedule(intervalMs);
    }

    const wake = () => {
      if (stopped) return;
      if (document.visibilityState !== "visible") {
        clearTimer();
        return;
      }
      // A check in flight schedules what follows it itself.
      if (check) return;
      const age = Date.now() - freshAtRef.current;
      // Not at once even when due: right after a wake from sleep, or the
      // "online" event, the network is often still coming up.
      const delay =
        failures > 0 || age >= intervalMs ? WAKE_DELAY_MS : intervalMs - age;
      // Repeated focus events must not keep pushing an earlier tick back —
      // but only a tick still in the FUTURE counts. An overdue one (nextAt in
      // the past) is a timer stuck behind a system sleep: browsers suspend
      // the monotonic clock timers run on, so it may be a whole interval
      // away. Reschedule then, or a woken laptop shows hours-old data.
      const untilNext = clock.nextAt === null ? null : clock.nextAt - Date.now();
      if (untilNext !== null && untilNext > 0 && untilNext <= delay) return;
      schedule(delay);
    };

    // A page restored from the router cache can be far older than the
    // interval: then refresh at once (still behind the check).
    const age = now - freshAtRef.current;
    schedule(age >= intervalMs ? 0 : intervalMs - age);

    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);

    return () => {
      stopped = true;
      clearTimer();
      check?.abort();
      clocks.delete(clock);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
    };
  }, [intervalMs, router, isNavigating, renderedAt]);
}

/**
 * The hook as a component: what the server component `<LiveRefresh>` renders
 * with its section's interval and the page's stamp. Renders nothing. The hook
 * itself stays private, so no caller can hand it a stamp of its own.
 */
export function LiveRefreshTimer(options: LiveRefreshOptions) {
  useLiveRefresh(options);
  return null;
}
