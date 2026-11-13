"use client";

import { useSearchParams } from "next/navigation";

import { useViewerTimeZone } from "@/components/Common/ViewerTimeZone";
import { isValidTimeZone, todayIn } from "@/lib/timezone";

/**
 * Today (`yyyy-MM-dd`) in the zone a timesheet, activity or report view is
 * read in: `?timezone` when it names a real zone, else the viewer's own — the
 * client twin of `resolveViewFilters()` (src/components/TimeSheets/viewFilters.ts).
 *
 * Date pickers default to it so their label names the day the server loaded.
 * A bare `new Date()` is the Node process's day during the server render and
 * the browser's day after hydration: whenever those two differ (any viewer
 * between their midnight and the server's), React threw #418 and the picker
 * said "Wed" over Thursday's timesheet.
 */
export function useViewToday(): string {
  const viewerZone = useViewerTimeZone();
  const requested = useSearchParams().get("timezone");
  return todayIn(requested && isValidTimeZone(requested) ? requested : viewerZone);
}
