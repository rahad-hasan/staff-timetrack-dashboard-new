import "server-only";
import { LiveRefreshTimer } from "@/hooks/useLiveRefresh";

/** How often the pages of each live section re-render while on screen, and why. */
const INTERVAL_MS = {
  /**
   * Two minutes, not one: each refresh re-runs the whole route — the shell's
   * reads plus seven panels, some of them heavy aggregates — for every
   * visible dashboard, and the backend's panel caches only spare that work
   * when an entry outlives the interval or is shared between viewers. The
   * header's work time keeps its own one-minute poll in between.
   */
  dashboard: 120_000,
  /**
   * Two minutes: entries keep arriving while the desktop tracker uploads, and
   * manual requests while the team files them. Often enough for a sheet that
   * grows by tracker segments, without a full route render per viewer per
   * minute.
   */
  timesheets: 120_000,
  /**
   * Five minutes: a day's screenshots and usage totals grow slowly, and each
   * refresh re-signs every screenshot URL on the server. The pictures already
   * on screen are kept, not downloaded again (ScreenshotImage); the new URLs
   * serve the ones not loaded yet. Apps and URLs share the section's cadence.
   */
  activity: 300_000,
} as const;

/**
 * Keeps a live page current while it is left open: the route re-renders at
 * its section's interval while the tab is visible (see useLiveRefresh).
 * Renders nothing.
 *
 * Render it at the top of each live PAGE — never in a layout — outside the
 * boundaries that a filter change remounts or a failed read replaces. It
 * dates the content on screen by the server render it runs in (`Date.now()`
 * below), and the router fetches and restores pages apart from their
 * layouts: a link back to a route the tab has shown reuses the cached layout
 * and refetches only the page below it, while Back/Forward and a link the
 * router serves from its cache restore the page with no fetch at all. A
 * layout's stamp reads the same either way, so it dated fresh pages as old
 * (a redundant refresh on arrival) and cached ones as fresh (an old sheet
 * shown as live for another interval). A page's stamp is new exactly when
 * its content is.
 *
 * Server-only: rendered by a client component, it would stamp every client
 * re-render as newly arrived content.
 */
export default function LiveRefresh({
  section,
}: {
  section: keyof typeof INTERVAL_MS;
}) {
  return (
    <LiveRefreshTimer
      intervalMs={INTERVAL_MS[section]}
      renderedAt={Date.now()}
    />
  );
}
