import { cache } from "react";
import { cookies } from "next/headers";
import { baseApi } from "@/actions/baseApi";
import { getOnboardingStatus } from "@/actions/onboarding/action";
import { getDecodedUser } from "@/utils/decodedLogInUser";

/**
 * Not `"use server"` — this module also exports a constant, and publishing it
 * as an action would let the browser call it directly. The dismiss action
 * lives in `src/actions/dashboard/sampleData.ts`.
 */
export const SAMPLE_DATA_DISMISSED_COOKIE = "stafftime-sample-data-dismissed";

const SAMPLE_ELIGIBLE_ROLES = ["admin", "manager", "hr"];

/**
 * Whether the dashboard should render demo fixtures instead of live data.
 *
 * True only while ALL of these hold, checked cheapest-first and failing
 * closed (any failed fetch → live data, never fake numbers over an outage):
 *
 *  1. the viewer has not dismissed the banner (cookie, per-browser);
 *  2. the viewer is admin/manager/hr — for employee and project_manager the
 *     backend scopes /dashboard/stats to the viewer's OWN hours, so "empty
 *     organization" is indistinguishable from "new hire in an active org";
 *     those roles always get live data;
 *  3. the organization tracked zero hours this calendar month AND every
 *     member's activity-report `last_active` is "Never" (no screenshot in
 *     its rolling 30-day lookback; the endpoint always lists the requesting
 *     admin, so an empty-array check would never pass) — the rolling window
 *     stops a month rollover from resurrecting demo data over an org that
 *     was tracking last week;
 *  4. the viewer's account is inside the server-computed `isNewUser` window.
 *
 * The two org-signal reads bypass the 60s Next data cache (`no-cache`, like
 * getOnboardingStatus) so the flip to real data after the first tracked
 * minute waits only on the backend's own cache, not two stacked TTLs.
 *
 * Wrapped in React `cache()` because all seven parallel-route slots call it
 * in the same request — the whole chain runs once.
 */
export const getSampleDataMode = cache(async (): Promise<boolean> => {
  const cookieStore = await cookies();
  if (cookieStore.get(SAMPLE_DATA_DISMISSED_COOKIE)?.value === "true") {
    return false;
  }

  const user = await getDecodedUser();
  if (!user?.role || !SAMPLE_ELIGIBLE_ROLES.includes(user.role)) {
    return false;
  }

  const stats = await baseApi(`/dashboard/stats?type=monthly`, {
    tag: "dashboardStats",
    cache: "no-cache",
  });
  if (stats?.data?.metrics?.work?.raw_hours !== 0) {
    return false;
  }

  const activity = await baseApi(`/admin/members/activity-report?limit=4`, {
    tag: "memberStats",
    cache: "no-cache",
  });
  const members = activity?.data?.members;
  if (
    !Array.isArray(members) ||
    !members.every((m) => m?.last_active === "Never")
  ) {
    return false;
  }

  const status = await getOnboardingStatus();
  return status?.data?.isNewUser === true;
});
