import "server-only";

import { cookies } from "next/headers";
import { baseApi } from "@/actions/baseApi";
import { isSessionToken } from "@/lib/server/session";
import type { QueryParams } from "@/utils/buildQuery";

/**
 * Answer a client-side `fetch()` with a live API read, as JSON.
 *
 * Reads a client component makes, on a timer (the header's work time, billing
 * status) or when it mounts (the pickers' options, the avatar), are served by
 * GET route handlers rather than server actions; the browser side is
 * `readLiveJson`. Next runs a tab's server actions one at a time, so a poll
 * would queue behind — and delay — the user's own saves, and a navigation that
 * lands while one is in flight costs an extra full refresh. A route handler
 * runs in parallel and can be aborted.
 *
 * The response mirrors baseApi's envelope; failures carry the API's status
 * (401 when the session is gone) so the caller can stop polling. It is
 * per-user data, so it must never be stored by a browser or proxy cache.
 *
 * Without a session cookie the API is not asked at all (see
 * `unauthorizedResponse`).
 */
export async function liveJson(
  path: string,
  query?: QueryParams,
): Promise<Response> {
  const token = (await cookies()).get("accessToken")?.value;
  if (!isSessionToken(token)) return unauthorizedResponse(token);
  return liveJsonResponse(
    await baseApi(path, { query, redirectOnUnauthorized: false }),
  );
}

/**
 * The 401 the API itself gives a request whose `accessToken` cookie is absent
 * or cannot be a token (`isSessionToken`), answered without calling it.
 *
 * These routes are public URLs (`/api/**` is outside the middleware), and the
 * API counts every call this server makes without a valid token against one
 * bucket, this server's address. Relayed, a stranger's requests here spent
 * the allowance that every signed-out step shares, creating an organization
 * at the end of sign-up among them. (A forged token of the right shape is
 * still relayed: this narrows that, it does not close it.)
 */
export function unauthorizedResponse(token: string | undefined): Response {
  // baseApi's envelope for that 401, with the API's own two messages
  // (backend middlewares/auth.ts)
  const envelope = {
    success: false,
    statusCode: 401,
    message: token ? "Invalid token" : "You are not authorized!",
  };
  return liveJsonResponse(envelope);
}

/**
 * The answer `liveJson` gives, for an envelope a route read itself — with
 * `redirectOnUnauthorized: false`, so a dead session is a JSON 401 rather
 * than a redirect its `fetch()` caller would follow.
 */
export function liveJsonResponse(
  result: { success?: boolean; statusCode?: unknown } | null | undefined,
): Response {
  const status =
    result?.success === false
      ? typeof result.statusCode === "number"
        ? result.statusCode
        : 502
      : 200;
  return Response.json(result, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
