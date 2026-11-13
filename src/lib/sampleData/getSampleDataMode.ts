import { cache } from "react";
import { cookies } from "next/headers";
import {
  getDashboardMembersStats,
  getDashboardStats,
} from "@/actions/dashboard/action";
import { getOnboardingStatus } from "@/actions/onboarding/action";
import { MANAGEMENT_ROLES, hasRole } from "@/lib/roles";
import { getDecodedUser } from "@/utils/decodedLogInUser";

/**
 * Not `"use server"` — this module also exports a constant, and publishing it
 * as an action would let the browser call it directly. The dismiss action
 * lives in `src/actions/dashboard/sampleData.ts`.
 */
export const SAMPLE_DATA_DISMISSED_COOKIE = "stafftime-sample-data-dismissed";

/**
 * Whether the dashboard should render demo fixtures instead of live data.
 *
 * True only while ALL of these hold, checked cheapest-first and failing
 * closed (any failed fetch → live data, never fake numbers over an outage):
 *
 *  1. the viewer has not dismissed the banner (cookie naming the dismisser);
 *  2. the viewer is admin/manager/hr — for employee and project_manager the
 *     backend scopes /dashboard/stats to the viewer's OWN hours, so "empty
 *     organization" is indistinguishable from "new hire in an active org";
 *     those roles always get live data;
 *  3. the viewer's account is inside the server-computed `isNewUser` window —
 *     checked before the org probes because it is free (the backend answers
 *     it from the auth cache, no query) and false for every account past its
 *     first 14 days, which then never pays for the monthly aggregate below;
 *  4. the organization tracked zero hours this calendar month AND every
 *     member's activity-report `last_active` is "Never" (no screenshot in
 *     its rolling 30-day lookback; the endpoint always lists the requesting
 *     admin, so an empty-array check would never pass) — the rolling window
 *     stops a month rollover from resurrecting demo data over an org that
 *     was tracking last week. The two probes are independent, so they run
 *     together.
 *
 * Every read is live, so the flip to real data after the first tracked
 * minute waits only on the backend's own 60s cache. The probes go through the
 * panels' own getters: the activity probe is the exact request the members
 * panel makes, so the two share one round trip in the same render.
 *
 * Wrapped in React `cache()` because the banner and all seven dashboard
 * panels call it in the same request — the whole chain runs once. Panels start
 * their own live read alongside it (`Promise.all`) rather than after it: only
 * a brand-new empty org, the one case that renders fixtures, wastes that read.
 */
export const getSampleDataMode = cache(async (): Promise<boolean> => {
  const user = await getDecodedUser();
  if (!hasRole(MANAGEMENT_ROLES, user?.role)) {
    return false;
  }

  // Dismissed by THIS user: the cookie holds the dismisser's id. One written
  // before it did ("true") names nobody and still counts for whoever uses the
  // browser it was set in, as it did then: nobody who already dismissed the
  // demo gets it back with the release that changed the value.
  const cookieStore = await cookies();
  const dismissedBy = cookieStore.get(SAMPLE_DATA_DISMISSED_COOKIE)?.value;
  if (dismissedBy === "true" || (dismissedBy !== undefined && dismissedBy === String(user?.id))) {
    return false;
  }

  const status = await getOnboardingStatus();
  if (status?.data?.isNewUser !== true) {
    return false;
  }

  const [stats, activity] = await Promise.all([
    getDashboardStats({ type: "monthly" }),
    getDashboardMembersStats({ limit: 4 }),
  ]);
  if (stats?.data?.metrics?.work?.raw_hours !== 0) {
    return false;
  }

  const members = activity?.data?.members;
  return (
    Array.isArray(members) &&
    members.every((m) => m?.last_active === "Never")
  );
});
