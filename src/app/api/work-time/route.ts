import { liveJson } from "@/lib/server/liveJson";

export const dynamic = "force-dynamic";

/**
 * `GET /api/work-time` → `{ data: { duration: "HH:MM:SS" } }`, the viewer's
 * own tracked time today. Polled by the header's HeaderWorkTime.
 *
 * A route handler rather than a server action: a tab runs its server actions
 * one at a time, so a once-a-minute poll would queue behind (and delay) the
 * user's saves. Answers 401 when the session is gone, which stops the poll.
 */
export async function GET() {
  return liveJson("/dashboard/work-time");
}
