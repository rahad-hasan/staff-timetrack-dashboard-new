import { BILLING_STATUS_FETCHED_AT_HEADER } from "@/lib/billing";
import { liveJson } from "@/lib/server/liveJson";

/**
 * `GET /api/billing/status` — the billing state machine, read live for
 * `billingStore`.
 *
 * The store polls this while a payment is being settled, so it is a route
 * handler rather than the `getBillingStatus` server action: Next runs a tab's
 * server actions one at a time, so every tick queued ahead of the user's own
 * billing clicks, and a navigation landing mid-poll cost an extra full-route
 * refresh. A `fetch()` runs alongside them and a superseded read can be
 * aborted. A dead session comes back as a JSON 401 rather than a redirect;
 * the store decides what that means for it.
 *
 * The answer carries the server time its read started (see
 * `BILLING_STATUS_FETCHED_AT_HEADER`): pages hand the store snapshots stamped
 * on the same clock, and only the newer of the two may stand.
 */
export async function GET() {
  const fetchedAt = Date.now();
  const response = await liveJson("/packages/billing/status");
  response.headers.set(BILLING_STATUS_FETCHED_AT_HEADER, String(fetchedAt));
  return response;
}
