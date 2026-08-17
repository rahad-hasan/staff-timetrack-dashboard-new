/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ICreateOrganizationResponse,
  IOrganizationOnboardingSession,
} from "@/types/type";
import { ORGANIZATION_ONBOARDING_REDIRECT } from "./organization";

/**
 * Sign-in has two success shapes. A finished account gets a token pair; an
 * account that was verified on the marketing site but never created its
 * organization gets `{ redirect: "/create-organization", email }` with null
 * tokens. Both come back `success: true`, so the caller has to branch on the
 * payload rather than on the envelope.
 */
export const requiresOrganizationOnboarding = (
  response: any,
): response is { data: IOrganizationOnboardingSession } =>
  Boolean(
    response?.success &&
      response?.data?.redirect === ORGANIZATION_ONBOARDING_REDIRECT &&
      !response?.data?.accessToken,
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
