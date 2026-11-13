import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { baseApi } from "@/actions/baseApi";
import { isValidTimeZone } from "@/lib/timezone";
import type { IResponse } from "@/types/type";

/**
 * Three base64url segments: the only shape the API's tokens come in. The same
 * test as middleware.ts, whose copy is not exported; keep the two in step.
 */
const JWT_SHAPE = /^[\w-]+\.[\w-]+\.[\w-]+$/;

/**
 * Whether an `accessToken` cookie value could be a session at all. Anything
 * else (no cookie, Express's "j:null") gets the API's 401 for certain, so a
 * route handler can answer that itself: `/api/**` is outside the middleware,
 * and every call made for an anonymous visitor is counted against the one
 * rate-limit bucket the API keeps for this whole server.
 */
export const isSessionToken = (token: string | undefined): token is string =>
  token !== undefined && JWT_SHAPE.test(token);

/**
 * The API's account gate (backend services/accountAccess.service.ts): auth()
 * refuses EVERY request of a deactivated, plan-parked or removed account with
 * a coded 403 (ACCOUNT_DEACTIVATED, ACCOUNT_INACTIVE_OVER_LIMIT) or 404
 * (ACCOUNT_DELETED, ACCOUNT_REMOVED). The code reaches baseApi's envelope
 * where the API mirrors it, in the first error's `path`.
 *
 * Told by the code, never by the status alone: an API build without the
 * session route answers 404 "API not found!", which must stay an unreadable
 * session (the cookie fallback), not a sign-out.
 */
const isAccountGateRefusal = (
  res: IResponse<SessionUser> | null | undefined,
): boolean => {
  if (res?.success !== false) return false;
  if (res.statusCode !== 403 && res.statusCode !== 404) return false;
  const code: unknown = res.errorMessages?.[0]?.path;
  return typeof code === "string" && code.startsWith("ACCOUNT_");
};

/** The signed-in user as the API sees them right now (GET /auth/session). */
export interface SessionUser {
  id: number;
  company_id: number;
  name: string;
  email: string;
  role: string;
  time_zone: string | null;
  is_tracking?: boolean;
  url_tracking?: boolean;
}

/**
 * The current user, read live from the API — once per request.
 *
 * Identity used to come only from what was written at login: the `userRole` /
 * `timeZone` cookies and the localStorage user store. Both stay frozen until
 * the next login, so a role or time-zone change never reached an open session.
 * `/auth/session` is answered from the backend's auth cache, which every User
 * write invalidates, so it is both cheap and current. React `cache()` shares
 * one call across the layout, pages and helpers of a single render.
 *
 * Returns null without a session cookie, or when the API is unreachable —
 * callers then fall back to the cookie identity. A 401 redirects to
 * /session-expired like every other read, and so does the account gate: that
 * account can use no endpoint until it is restored, so its session is over.
 * Read as an outage, the gate left a dashboard of error cards that retried
 * for as long as the tab stayed open. /session-expired reads no session, so
 * the redirect cannot come back here.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get("accessToken")?.value;
  if (!token) return null;
  const res = await baseApi<IResponse<SessionUser>>("/auth/session");
  if (isAccountGateRefusal(res)) redirect("/session-expired");
  return res?.success && res.data ? res.data : null;
});

/**
 * The IANA zone that "today" means for the viewer: their own zone from the
 * live session, else the zone cookie written at login, else UTC.
 *
 * Server components must never derive a default date from `new Date()` alone:
 * that is the Node process's zone, so between the viewer's midnight and the
 * server's, every "today" view would query the wrong day.
 */
export const getViewerTimeZone = cache(async (): Promise<string> => {
  const user = await getSessionUser();
  const cookieZone = (await cookies()).get("timeZone")?.value;
  for (const zone of [user?.time_zone, cookieZone]) {
    if (zone && isValidTimeZone(zone)) return zone;
  }
  return "UTC";
});
