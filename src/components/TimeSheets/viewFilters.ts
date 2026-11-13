import "server-only";

import { getViewerTimeZone } from "@/lib/server/session";
import { isValidTimeZone, parseDateParam, todayIn } from "@/lib/timezone";
import type { ISearchParams } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";

type SearchParamValues = Awaited<ISearchParams>;

/** The only shape of `date` the API reads. */
const DAY_PARAM = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The URL filters the timesheet, activity and report views share — `?date`,
 * `?user_id`, `?timezone` — with their defaults filled in. Every server
 * component of those views resolves them here, so they cannot drift apart
 * again (only one of nine copies used to fall back to the zone cookie).
 *
 * The default day is today *in the zone the view is read in*: `?timezone`
 * when it names a real zone, else the viewer's own. That is exactly the zone
 * the backend reads a bare `date` in (`timezone || the user's time_zone`).
 * `new Date()` alone is the Node process's day — between the viewer's
 * midnight and the server's, every default view loaded the wrong day while
 * the date picker, which shows the browser's today, said "today".
 */
export async function resolveViewFilters(params: SearchParamValues) {
  const requestedZone =
    typeof params.timezone === "string" && isValidTimeZone(params.timezone)
      ? params.timezone
      : undefined;
  // Only a real day in the API's shape, "real" by the date pickers' own rule
  // (parseDateParam). For anything else ("2026-02-31", "foo") they show
  // today, while the raw value went to the API: its error is the same on
  // every retry, so the view sat on an error card that re-rendered the route
  // every minute.
  const requestedDate =
    typeof params.date === "string" &&
    DAY_PARAM.test(params.date) &&
    parseDateParam(params.date) !== null
      ? params.date
      : undefined;

  // Independent reads: neither may wait for the other.
  const [user, zone] = await Promise.all([
    getDecodedUser(),
    requestedZone ?? getViewerTimeZone(),
  ]);
  const today = todayIn(zone);

  return {
    /** The signed-in viewer, or null without a session. */
    user,
    /** Whose data the view shows: `?user_id`, else the viewer's own. */
    userId: params.user_id ?? user?.id,
    /** The IANA zone the view's days are read in. */
    zone,
    /** Today in `zone`, as `yyyy-MM-dd`. */
    today,
    /** The day the view shows: `?date` when it names a real day, else `today`. */
    date: requestedDate ?? today,
  };
}
