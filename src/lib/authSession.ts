/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ICreateOrganizationResponse,
  ICreateOrganizationResult,
  IOrganizationOnboardingSession,
} from "@/types/type";
import { ORGANIZATION_ONBOARDING_REDIRECT } from "./organization";

/** The fields of a sign-in style answer that hold a JWT. */
const SESSION_TOKEN_FIELDS = ["accessToken", "refreshToken"] as const;

type SessionTokenField = (typeof SESSION_TOKEN_FIELDS)[number];

/**
 * A sign-in style `data` as a server action hands it to the browser: the
 * API's fields without the JWTs, plus whether the answer started a session
 * (what `startSession` returned) — the one thing callers used to read off the
 * tokens.
 */
export type ClientSessionData<T> = Omit<T, SessionTokenField> & {
  hasSession: boolean;
};

/** The account `createOrganization` just created, as the wizard receives it. */
export type ICreatedOrganization = ClientSessionData<ICreateOrganizationResponse>;

/** What the `createOrganization` action returns. */
export type ICreateOrganizationClientResult = Omit<
  ICreateOrganizationResult,
  "data"
> & { data?: ICreatedOrganization };

/**
 * `data` without its JWT fields; every other field is kept as it came.
 *
 * The session cookies are httpOnly, but the API also returns the tokens in the
 * body, and whatever a server action returns is delivered to page JavaScript.
 * Every action that receives tokens writes its cookies from the full answer
 * first, then returns it through here.
 */
export const withoutSessionTokens = <T>(data: T): Omit<T, SessionTokenField> => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const safe = { ...(data as Record<string, unknown>) };
  for (const field of SESSION_TOKEN_FIELDS) delete safe[field];
  return safe as Omit<T, SessionTokenField>;
};

/**
 * Sign-in has two success shapes. A finished account gets a session; an
 * account that was verified on the marketing site but never created its
 * organization gets `{ redirect: "/create-organization", email }` and none
 * (the API answers it with null tokens). Both come back `success: true`, so
 * the caller has to branch on the payload rather than on the envelope. The
 * tokens themselves never reach the browser: `logIn` reports `hasSession`.
 */
export const requiresOrganizationOnboarding = (
  response: any,
): response is {
  data: ClientSessionData<IOrganizationOnboardingSession>;
} =>
  Boolean(
    response?.success &&
      response?.data?.redirect === ORGANIZATION_ONBOARDING_REDIRECT &&
      !response?.data?.hasSession,
  );

/**
 * Shapes the `logInUserStore` record. Sign-in and organization creation return
 * the same user fields, the latter nesting the freshly created company, so one
 * builder covers both entry points.
 */
export const buildLogInUserData = (
  data: Partial<ICreateOrganizationResponse> & Record<string, any>,
) => ({
  id: data?.id,
  name: data?.name,
  email: data?.email,
  image: data?.image,
  // The response ships an already-signed avatar URL; stamping it here stops
  // the first dashboard paint from re-reading one it just received.
  imageSyncedAt: Date.now(),
  role: data?.role,
  phone: data?.phone,
  timezone: data?.company?.time_zone ?? data?.time_zone,
  company_id: data?.company_id ?? data?.company?.id,
});
