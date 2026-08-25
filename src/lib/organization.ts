import { IWorkspacePreferences, WeekStartDay } from "@/types/type";

/**
 * Onboarding metadata shared by the create-organization form and the server
 * action that persists it.
 *
 * The API splits what the wizard presents as one flow across two endpoints:
 * `POST /company` only accepts the company identity (name, email, phone,
 * address, time zone), while `PATCH /company/:id` owns the tracking
 * preferences. Leave allowances are deliberately absent — they live on the
 * four LeaveType rows the create transaction seeds and are managed from Leave
 * Management, not from the Company record.
 *
 * Keeping the defaults here — in lockstep with the Company model — lets the
 * action skip the follow-up write whenever nothing was actually changed.
 */

export const ORGANIZATION_ONBOARDING_REDIRECT = "/create-organization";

/* ------- exact `POST /company` rejections the wizard keys off -------
 * Same pattern as the billing cap catches: these two are terminal — no
 * amount of resubmitting the wizard can make them succeed, so the UI
 * routes to sign-in instead of leaving the user in a retry loop. */

/** The company email is already taken — the account is (or someone is) already set up. */
export const COMPANY_EMAIL_EXISTS_MESSAGE = "Email already exists";

/** No verified pending sign-up for this email — a stale or hand-edited link. */
export const PENDING_USER_MISSING_MESSAGE = "User not found in waiting list";

export const WEEK_START_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const satisfies ReadonlyArray<WeekStartDay>;

export const WEEKEND_LENGTH_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

/** Mirrors the Company model defaults (`prisma/schema.prisma`). */
export const DEFAULT_WORKSPACE_PREFERENCES: IWorkspacePreferences = {
  week_start: "Monday",
  weekly_leave_count: 2,
  idle_minutes_limit: 10,
  currency: "USD",
};

/**
 * The browser's own zone is right far more often than "UTC" is, and every
 * IANA id it can report is present in `popularTimeZoneList` (both come from
 * `Intl.supportedValuesOf`). Returns an empty string on the server or in the
 * rare engine that refuses to resolve one, which leaves the field unselected.
 */
export const resolveBrowserTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};
