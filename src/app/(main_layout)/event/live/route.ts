import type { NextRequest } from "next/server";
import { liveJson } from "@/lib/server/liveJson";

/**
 * `GET /event/live?year=YYYY&month=M` → that month's events, read live.
 *
 * Serves the event drawer's sync poll (a meeting link and calendar invites
 * are created by background jobs after the event is saved). It is a route
 * handler rather than the `getEvents` server action because Next runs a tab's
 * server actions one at a time: a 3-second poll would queue ahead of the
 * user's own Reschedule / Add members / Cancel clicks in the same drawer, and
 * a navigation landing mid-poll would cost an extra full-route refresh. A
 * `fetch()` runs alongside them and is aborted when the drawer closes.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const year = Number(params.get("year"));
  const month = Number(params.get("month"));

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    year < 1970 ||
    year > 9999 ||
    month < 1 ||
    month > 12
  ) {
    return Response.json(
      { success: false, message: "A valid year and month are required" },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  return liveJson("/events", { year, month });
}
