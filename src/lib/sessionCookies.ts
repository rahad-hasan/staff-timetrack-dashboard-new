import { cookies } from "next/headers";

/**
 * Session cookies are written from more than one place — sign in, password
 * reset and the create-organization onboarding step all end with the API
 * handing back a fresh token pair.
 *
 * This is a plain module on purpose: marking it `"use server"` would publish
 * every export as a callable server action, which would let the browser mint
 * a session of its own choosing. Only server actions may import it.
 */

/** 30 days. */
const MAX_AGE = 60 * 60 * 24 * 30;

const SESSION_COOKIES = [
  "accessToken",
  "refreshToken",
  "timeZone",
  // Identity fallbacks for `getDecodedUser` — the JWT carries no role. Every
  // reader sits behind a middleware-protected route, so they are only ever
  // consulted alongside a token and must be dropped with it.
  "userId",
  "userEmail",
  "userRole",
] as const;

export interface ISessionTokens {
  accessToken?: string | null;
  refreshToken?: string | null;
  timeZone?: string | null;
}

export interface ISessionIdentity {
  id?: number | string | null;
  email?: string | null;
  role?: string | null;
}

/**
 * A sign-in that resolves to an onboarding redirect answers 200 with null
 * tokens. Writing those would leave `middleware.ts` believing the visitor is
 * authenticated and every API call would come back 401 → /session-expired.
 */
export const hasSessionTokens = (tokens: ISessionTokens | null | undefined) =>
  Boolean(tokens?.accessToken && tokens?.refreshToken);

const buildOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
});

export async function writeSessionCookies(
  tokens: ISessionTokens,
  identity: ISessionIdentity = {},
) {
  const cookieStore = await cookies();
  const options = buildOptions();

  if (tokens.accessToken) {
    cookieStore.set("accessToken", tokens.accessToken, options);
  }

  if (tokens.refreshToken) {
    cookieStore.set("refreshToken", tokens.refreshToken, options);
  }

  if (tokens.timeZone) {
    cookieStore.set("timeZone", tokens.timeZone, options);
  }

  if (identity.id !== undefined && identity.id !== null) {
    cookieStore.set("userId", String(identity.id), options);
  }

  if (identity.email) {
    cookieStore.set("userEmail", identity.email, options);
  }

  if (identity.role) {
    cookieStore.set("userRole", identity.role, options);
  }
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  SESSION_COOKIES.forEach((name) => cookieStore.delete(name));
}
