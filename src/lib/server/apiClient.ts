import "server-only";

/**
 * What the dashboard's server-side API clients share: baseApi, and the
 * integration run relay (lib/server/integrationRun.ts), which cannot go
 * through it because a run outlasts server-side fetch's header timeout.
 */

/**
 * Per-request log line, written AFTER the response so it proves a network
 * round trip (and how long it took). On by default only in `next dev`; set
 * API_LOG=1 to enable it in a production build. The query string is left out
 * of production logs because it carries user input (search boxes).
 */
export const LOG_REQUESTS =
  process.env.API_LOG === "1" || process.env.NODE_ENV === "development";

export function logRequest(method: string, path: string, status: number | string, startedAt: number) {
  const shown = process.env.NODE_ENV === "development" ? path : path.split("?")[0];
  console.log(`[api] ${method} ${shown} ${status} ${Math.round(performance.now() - startedAt)}ms`);
}

/** The answer when the API could not be reached at all. */
export const SERVER_NOT_ACTIVE = "Server is not active. Please try again later.";
