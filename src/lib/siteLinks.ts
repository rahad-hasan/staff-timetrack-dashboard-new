/**
 * Links that leave the dashboard.
 *
 * Kept out of the components so the marketing domain is changed in one place
 * rather than hunted for across menus.
 */

/** Public marketing site — the auth pages' logo and "Refer a friend". */
export const MARKETING_SITE_URL = "https://stafftimetracker.org";

/**
 * Where new accounts are created. The dashboard has no sign-up form of its
 * own: this page posts `/auth/create-account` and hands the browser back to
 * `/auth/verify-otp`, and the retired `/auth/sign-up` route redirects here
 * (see `next.config.ts`).
 *
 * The trailing slash is canonical — without it WordPress answers with a 301
 * first, an extra round trip on the way into the funnel.
 *
 * To carry a plan choice along, build the URL with `buildMarketingSignUpUrl`
 * (`marketingPlanIntent.ts`), which speaks this page's query dialect.
 */
export const MARKETING_SIGN_UP_URL = `${MARKETING_SITE_URL}/sign-up/`;
