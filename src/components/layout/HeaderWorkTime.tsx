"use client";

import { useEffect, useState } from "react";
import { isRouteRefreshNear } from "@/hooks/useLiveRefresh";

/** The API recomputes the figure from completed tracker uploads; a minute is as fresh as it gets. */
const POLL_INTERVAL_MS = 60_000;
/** A figure older than this is read again at once: back on the tab, or shown again by Back/Forward. */
const STALE_ON_RETURN_MS = 30_000;
/** Back online: give the connection a moment to settle before reading. */
const ONLINE_SETTLE_MS = 3_000;
/**
 * A page's live refresh that fired or fires within this window will hand down
 * a fresh figure with its render, so the poll holds off — longer than a slow
 * full-route render, short enough that a refresh which never lands (skipped,
 * failed) delays the figure by seconds, not a minute.
 */
const ROUTE_REFRESH_WINDOW_MS = 15_000;
const REMEMBERED_RENDERS = 50;

/*
 * What this tab has shown, kept across remounts of the layout. Client-only:
 * written in effects and poll results, read only in the browser — on the
 * server this module is shared by every request.
 *
 * A layout render whose `renderedAt` was shown before is the layout restored
 * from the router cache — Back/Forward across the (main_layout) boundary,
 * e.g. from /billing/checkout — carrying the figure of its first showing,
 * which can be far older than the newest one. The stamp is used only as an
 * identity, never compared with this tab's clock: a client clock off the
 * server's would otherwise make every render look stale (or fresh).
 */
const shownRenders = new Set<number>();
/** The newest figure this tab has shown (server render or poll), and when it got it — its own clock. */
let newest: { value: string; at: number } | null = null;

/** In the browser, the newest known figure when this render is a restore. */
function restoredFigure(renderedAt: number): string | undefined {
  if (typeof window === "undefined") return undefined;
  return shownRenders.has(renderedAt) ? newest?.value : undefined;
}

interface HeaderWorkTimeProps {
  /** "HH:MM:SS" from this server render of the layout; undefined when that read failed. */
  duration?: string;
  /** Stamped by the layout on every server render: a new value means `duration` is fresh. */
  renderedAt: number;
}

/**
 * The header's "today worked" figure — the number a time tracker is judged by.
 *
 * It used to be a bare layout prop, and the shared layout is not re-rendered
 * on client navigation, so it showed the time from page load until something
 * unrelated re-rendered the root. The layout's value still paints first (no
 * flash, no extra request on load); this keeps it current:
 *
 *  - reads GET /api/work-time every minute while the tab is visible — a route
 *    handler, not a server action, so a poll never waits in line behind the
 *    user's saves or costs a navigation an extra refresh;
 *  - reads at once when the tab comes back after more than ~30s away, or
 *    when Back/Forward shows a cached render of the layout whose figure is
 *    that old — showing the newest figure it knows meanwhile, rather than
 *    jumping back to the one cached with that render;
 *  - not while the browser is offline; it reads a moment after reconnecting;
 *  - adopts every fresh value the layout hands down (router.refresh, a
 *    revalidating action, a page's live refresh) and restarts the countdown
 *    from it, aborting a read in flight — a server render is never followed by
 *    a redundant poll. Nor preceded by one: a poll that falls just before or
 *    after a page's live refresh waits for that render instead;
 *  - stops on a 401: the session is gone, and the next server render deals
 *    with that.
 *
 * It never ticks on its own: the API counts completed tracker uploads only, so
 * a client-side clock would run ahead of every other number on screen.
 */
export default function HeaderWorkTime({ duration, renderedAt }: HeaderWorkTimeProps) {
  const [value, setValue] = useState(() => restoredFigure(renderedAt) ?? duration);

  // Adopt a fresh server value while rendering (React's "adjust state when a
  // prop changes"), so a refresh never shows a frame of the old figure. A
  // render whose read failed keeps the last known figure rather than blanking.
  // (A mounted layout is only ever re-rendered by the server, so a changed
  // stamp here is always fresh; a restore remounts, see the initializer.)
  const [seenRender, setSeenRender] = useState(renderedAt);
  if (seenRender !== renderedAt) {
    setSeenRender(renderedAt);
    if (duration !== undefined) setValue(duration);
  }

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let request: AbortController | null = null;
    let stopped = false;

    if (!shownRenders.has(renderedAt)) {
      // A render this tab has never shown: it just came from the server, so
      // its figure is current. One whose read failed leaves the last known
      // figure on screen, and that figure's age.
      shownRenders.add(renderedAt);
      if (shownRenders.size > REMEMBERED_RENDERS) {
        const oldest = shownRenders.values().next();
        if (!oldest.done) shownRenders.delete(oldest.value);
      }
      if (duration !== undefined) newest = { value: duration, at: Date.now() };
    }
    // When the figure on screen was obtained, on this tab's clock: now for a
    // fresh render; for a restored one, whenever the newest figure arrived.
    let freshAt = newest?.at ?? 0;

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const schedule = (delay: number) => {
      clearTimer();
      if (stopped || document.visibilityState !== "visible") return;
      timer = setTimeout(poll, Math.max(0, delay));
    };

    async function poll() {
      timer = null;
      if (stopped || request || document.visibilityState !== "visible") return;

      // Offline: nothing to read. "online" wakes it sooner; this re-check
      // covers a browser that never sends that event.
      if (navigator.onLine === false) {
        schedule(POLL_INTERVAL_MS);
        return;
      }

      // A page's live refresh just re-rendered, or is about to re-render, the
      // layout — this figure included. Wait for that render (it restarts this
      // effect) rather than race it; if it never lands, check again shortly.
      if (isRouteRefreshNear(ROUTE_REFRESH_WINDOW_MS)) {
        schedule(2 * ROUTE_REFRESH_WINDOW_MS);
        return;
      }

      const controller = new AbortController();
      request = controller;
      try {
        const res = await fetch("/api/work-time", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (res.status === 401) {
          stopped = true;
          return;
        }
        const body = res.ok ? await res.json() : null;
        const next = body?.data?.duration;
        if (typeof next === "string") {
          setValue(next);
          newest = { value: next, at: Date.now() };
          freshAt = newest.at;
        }
      } catch {
        // Aborted: unmounted, or superseded by a fresher server render.
        if (controller.signal.aborted) return;
        // Anything else (offline, API down): keep the figure, retry next tick.
      } finally {
        request = null;
      }
      schedule(POLL_INTERVAL_MS);
    }

    /** Read after `delay` if the figure is stale; otherwise resume the countdown. */
    const resume = (delay: number) => {
      // A read in flight schedules the next one itself.
      if (request) return;
      const age = Date.now() - freshAt;
      schedule(age >= STALE_ON_RETURN_MS ? delay : POLL_INTERVAL_MS - age);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        clearTimer();
        return;
      }
      // A zero-delay timer rather than an immediate read: a page's live
      // refresh wakes on this same event, and the poll should see whether one
      // is about to fire.
      resume(0);
    };
    const onOnline = () => resume(ONLINE_SETTLE_MS);

    // Fresh render: the full minute. Restored render with a stale figure (or
    // none yet): at once.
    resume(0);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);

    return () => {
      stopped = true;
      clearTimer();
      request?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
    };
    // `duration` only ever changes together with `renderedAt` (one server
    // render brings both), so this still runs once per render.
  }, [renderedAt, duration]);

  return <span className="  dark:text-darkTextPrimary">{value}</span>;
}
