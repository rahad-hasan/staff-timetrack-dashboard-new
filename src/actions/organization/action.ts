"use server";

import { revalidateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { baseApi } from "../baseApi";
import { writeSessionCookies } from "@/lib/sessionCookies";
import {
  ICompany,
  ICreateOrganizationPayload,
  ICreateOrganizationResponse,
  ICreateOrganizationResult,
  IResponse,
} from "@/types/type";

/**
 * Creating an organization is the last step of a signup that started on the
 * marketing site: the account already exists as a verified `pendingUser`, and
 * `POST /company` promotes it into a real admin user, seeds the default leave
 * types, starts the reverse trial and hands back a token pair.
 *
 * The endpoint is deliberately unauthenticated and only accepts the company
 * identity. Everything else the wizard collects is applied right after, with
 * the session it just established.
 */

/**
 * Runs an API call that must never take the caller down with it. Next's
 * control-flow signals (the `redirect("/session-expired")` inside `baseApi`,
 * most of all) still propagate — swallowing those would strand the user on a
 * half-rendered page.
 */
const settle = async <T>(request: () => Promise<T>): Promise<T | null> => {
  try {
    return await request();
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
};

/**
 * `week_start`, `weekly_leave_count`, `idle_minutes_limit` and `currency` are
 * not part of the create contract — `PATCH /company/:id` owns them. Only the
 * values the user actually moved off the model defaults are sent, so an
 * untouched step costs no request at all.
 */
const applyCompanyPreferences = async (
  company: ICompany,
  payload: ICreateOrganizationPayload,
): Promise<boolean> => {
  const patch: Record<string, unknown> = {};

  if (payload.week_start && payload.week_start !== company?.week_start) {
    patch.week_start = payload.week_start;
  }

  if (
    Number.isInteger(payload.weekly_leave_count) &&
    payload.weekly_leave_count !== company?.weekly_leave_count
  ) {
    patch.weekly_leave_count = payload.weekly_leave_count;
  }

  if (
    Number.isFinite(payload.idle_minutes_limit) &&
    payload.idle_minutes_limit !== company?.idle_minutes_limit
  ) {
    patch.idle_minutes_limit = payload.idle_minutes_limit;
  }

  const currency = payload.currency?.trim().toUpperCase();

  if (currency && currency !== company?.currency) {
    patch.currency = currency;
  }

  if (!Object.keys(patch).length) {
    return true;
  }

  const response = await settle(() =>
    baseApi<IResponse<ICompany>>(`/company/${company.id}`, {
      method: "PATCH",
      body: patch,
      cache: "no-cache",
    }),
  );

  return Boolean(response?.success);
};

export const createOrganization = async (
  payload: ICreateOrganizationPayload,
): Promise<ICreateOrganizationResult> => {
  if (!payload?.email) {
    return {
      success: false,
      message: "We lost track of your sign-up email. Please sign in again.",
    };
  }

  const response = await baseApi<IResponse<ICreateOrganizationResponse>>(
    "/company",
    {
      method: "POST",
      // Everything outside this set is rejected or ignored by the create
      // contract; the rest of the wizard is applied below.
      body: {
        name: payload.name.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        time_zone: payload.time_zone,
      },
      cache: "no-cache",
    },
  );

  const created = response?.data;

  if (!response?.success || !created?.accessToken || !created?.refreshToken) {
    return {
      success: false,
      message:
        response?.message ||
        "We could not create your organization. Please try again.",
    };
  }

  // From here the account exists and the user is signed in — no later failure
  // may be reported as "organization not created".
  await writeSessionCookies(
    {
      accessToken: created.accessToken,
      refreshToken: created.refreshToken,
      timeZone: created.company?.time_zone ?? created.time_zone,
    },
    {
      id: created.id,
      email: created.email,
      role: created.role,
    },
  );

  const warnings: string[] = [];

  // A response without the company is malformed rather than impossible — treat
  // it like a failed preference write instead of skipping the step in silence.
  const preferencesSaved = created.company?.id
    ? await applyCompanyPreferences(created.company, payload)
    : false;

  if (!preferencesSaved) {
    warnings.push(
      "Your workspace preferences could not be saved — you can set them in Settings.",
    );
  }

  revalidateTag("company");
  revalidateTag("profile");
  // The create transaction seeds this company's default leave types.
  revalidateTag("leave-types");

  return {
    success: true,
    message: response.message || "Organization created successfully",
    data: created,
    ...(warnings.length ? { warnings } : {}),
  };
};
