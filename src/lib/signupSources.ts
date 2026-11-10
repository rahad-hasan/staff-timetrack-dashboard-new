/**
 * "How did you hear about us?" — the last question of the create-organization
 * wizard, stored on `Company.signup_source`.
 *
 * The values are the API's `SignupSource` enum and must match it exactly:
 * `POST /company` silently drops a value it does not know (attribution is
 * never allowed to fail a signup), so a typo here would not error — it would
 * just lose the answer. Add a value in the backend enum first.
 *
 * Kept free of UI imports on purpose: the form schema reads these values, and
 * every form that imports the schema would otherwise pull in the icons. The
 * labels, icons and order live with the picker (SignupSourcePicker).
 */
export const SIGNUP_SOURCE_VALUES = [
  "google_ads",
  "facebook_ads",
  "instagram",
  "linkedin_ads",
  "youtube",
  "x_twitter",
  "tiktok",
  "organic_search",
  "chatgpt",
  "gemini",
  "claude",
  "perplexity",
  "referral",
  "email_campaign",
  "review_site",
  "blog",
  "event",
  "other",
] as const;

export type SignupSource = (typeof SIGNUP_SOURCE_VALUES)[number];

export const SIGNUP_SOURCE_OTHER: SignupSource = "other";

/** Mirrors `Company.signup_source_detail VARCHAR(100)`. */
export const SIGNUP_SOURCE_DETAIL_MAX_LENGTH = 100;
