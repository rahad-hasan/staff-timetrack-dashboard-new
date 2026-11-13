import "server-only";

/*
 * Live reads that fail must say so.
 *
 * baseApi never throws for a failed read: it resolves to `{ success: false }`,
 * with the API's status, or with none when the request got no answer at all.
 * Rendered as `res?.data ?? []`, every failure looked like an empty day (no
 * time entries, zero totals), and a background refresh that failed replaced
 * the good data on screen with it. These helpers throw instead, into the
 * view's error boundary, whose AutoRecoveringError heals the view once the API
 * answers again. A 401 never gets here: baseApi has already redirected to
 * /session-expired.
 */

/** What a read action resolves to: baseApi's envelope, or null for a 2xx without a JSON body. */
type LiveRead =
  | { success?: boolean; statusCode?: number; message?: string; data?: unknown }
  | null
  | undefined;

/** The read's `data`, typed as the action types it (an untyped action stays `any`). */
type DataOf<R extends LiveRead> = NonNullable<NonNullable<R>["data"]>;

/** For the server log only: production sends the browser a digest, never this text. */
function readFailed(what: string, res: LiveRead): Error {
  const reason =
    res?.success === false
      ? `${res.statusCode ?? "no response"}${res.message ? ` (${res.message})` : ""}`
      : "malformed response";
  return new Error(`Could not load ${what}: ${reason}`);
}

/**
 * The data of a live read, for a view that has nothing honest to show without
 * it. Anything else throws: an error status, no answer, or a 2xx without data.
 */
export function requireLiveData<R extends LiveRead>(res: R, what: string): DataOf<R> {
  if (res?.success === true && res.data != null) return res.data as DataOf<R>;
  throw readFailed(what, res);
}

/**
 * The API's catch-all answers (backend src/app/utils): no route or service
 * decided them, so they say nothing about this request. "Prisma error" (400)
 * is every database error the error handler does not classify, outages
 * included: a raw query cut off by a Postgres restart (P2010), too many
 * connections (P2037). "API not found!" (404) is a path the API that
 * answered does not have: an older build, or the wrong API altogether.
 */
const CATCH_ALL_MESSAGES = new Set(["Prisma error", "API not found!"]);

/**
 * For a view that renders the API's refusals: a 4xx passes, every other
 * failure throws as in requireLiveData.
 *
 * A 4xx is the API's considered answer to THIS request (no access to the
 * member asked for, no such member, a filter it cannot read, a company whose
 * plan no longer admits the read), and asking again gets the same one. The
 * view keeps its empty state for it, with the message where it shows one,
 * instead of an error that retries forever. 408 and 429 mean "later", not
 * "no", and a catch-all answer is no answer at all.
 */
export function requireDataOrRefusal(res: LiveRead, what: string): void {
  const status = res?.success === false ? res.statusCode : undefined;
  const refused =
    status !== undefined &&
    status >= 400 &&
    status < 500 &&
    status !== 408 &&
    status !== 429 &&
    !CATCH_ALL_MESSAGES.has(res?.message ?? "");
  if (!refused) requireLiveData(res, what);
}
