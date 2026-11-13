import { cookies } from "next/headers";

/**
 * Session cookies are written from more than one place — sign in, password
 * reset and the create-organization onboarding step all end with the API
 * handing back a fresh token pair. `startSession` is the one way to persist
 * such a response, so a token pair can never again be written without the
 * identity it belongs to (password reset used to skip it).
 *
 * This is a plain module on purpose: marking it `"use server"` would publish
 * every export as a callable server action, which would let the browser mint
 * a session of its own choosing. Only server actions and route handlers may
 * import it.
 */

/** 30 days. */
const MAX_AGE = 60 * 60 * 24 * 30;

const SESSION_COOKIES = [
  "accessToken",
  "refreshToken",
  "timeZone",
  // Identity fallbacks for `getDecodedUser` when the live session cannot be
  // read — the JWT carries no role. Every reader sits behind a
  // middleware-protected route, so they are only ever consulted alongside a
  // token and must be dropped with it.
  "userId",
  "userEmail",
  "userRole",
] as const;

type SessionCookie = (typeof SESSION_COOKIES)[number];

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
 * The root of every response that signs a user in: `POST /auth/signin`,
 * `POST /auth/reset-password` and `POST /company` all return the user's own
 * fields flattened next to the token pair.
 */
export interface ISessionPayload {
  accessToken?: string | null;
  refreshToken?: string | null;
  id?: number | string | null;
  email?: string | null;
  role?: string | null;
  time_zone?: string | null;
  /** Only `POST /company` nests the company it just created. */
  company?: { time_zone?: string | null } | null;
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

/**
 * Writes whichever session cookies are given.
 *
 * A token pair starts a new session — possibly for a different user than the
 * one whose cookies are still in this browser. Everything describing the user
 * is then replaced as a set: a value the call does not provide is DELETED, not
 * inherited from the previous session (a password-reset sign-in used to keep a
 * previous user's `userRole`). A partial write — `changePassword`'s rotated
 * access token, a profile's new time zone — continues the current session and
 * leaves the other cookies alone.
 */
export async function writeSessionCookies(
  tokens: ISessionTokens,
  identity: ISessionIdentity = {},
) {
  const cookieStore = await cookies();
  const options = buildOptions();
  const startsSession = hasSessionTokens(tokens);

  const values: Record<SessionCookie, string | undefined> = {
    accessToken: tokens.accessToken || undefined,
    refreshToken: tokens.refreshToken || undefined,
    timeZone: tokens.timeZone || undefined,
    userId:
      identity.id === undefined || identity.id === null
        ? undefined
        : String(identity.id),
    userEmail: identity.email || undefined,
    userRole: identity.role || undefined,
  };

  for (const name of SESSION_COOKIES) {
    const value = values[name];
    if (value) {
      cookieStore.set(name, value, options);
    } else if (startsSession) {
      cookieStore.delete(name);
    }
  }

}

/**
 * Persists the session a sign-in style response just issued: the token pair
 * and the identity it belongs to, always together. A response without a token
 * pair signs nobody in, so whatever an earlier session left behind is cleared
 * instead. Returns whether a session was written.
 */
export async function startSession(
  payload: ISessionPayload | null | undefined,
): Promise<boolean> {
  if (!payload || !hasSessionTokens(payload)) {
    await clearSessionCookies();
    return false;
  }

  await writeSessionCookies(
    {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      // The same zone `buildLogInUserData` seeds the client store with.
      timeZone: payload.company?.time_zone ?? payload.time_zone,
    },
    { id: payload.id, email: payload.email, role: payload.role },
  );
  return true;
}

/** Ends the session in this browser. (The sample-data dismissal stays: it
 * names the user who made it, so it cannot leak to the next one.) */
export async function clearSessionCookies() {
  const cookieStore = await cookies();
  SESSION_COOKIES.forEach((name) => cookieStore.delete(name));
}
