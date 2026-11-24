/**
 * Awin click capture rules shared by `middleware.ts` (edge) and the server
 * actions that forward a click to the API. Dependency-free on purpose: the
 * middleware runs in the edge runtime, and pure rules are trivial to test.
 *
 * The API owns the real decisions (backend `modules/Affiliate/awin.shared.ts`):
 * this side only refuses to store or forward anything that is not an Awin
 * click id, and keeps the cookie contract identical to the API's
 * `POST /affiliates/awin/click`, which the marketing site uses.
 */

/** The publisher click id (`?awc=`). HttpOnly; only ever set by a server. */
export const AWIN_CLICK_COOKIE = "stt_awc";
/** A strictly-necessary click (`?awc=…&sn=1`), kept regardless of consent. */
export const AWIN_CLICK_SN_COOKIE = "stt_awc_sn";
/**
 * Marketing consent, `granted` | `denied`. Written by a consent manager, never
 * by this app; absent = unknown, and Awin then applies its documented default.
 */
export const MARKETING_CONSENT_COOKIE = "stt_marketing_consent";

const DAY_SECONDS = 86_400;

/**
 * The programme's cookie period. MUST equal the API's AWIN_COOKIE_DAYS (and
 * the period configured in Awin). Inlined at build time.
 */
export const AWIN_COOKIE_DAYS = (() => {
  const days = Number(process.env.NEXT_PUBLIC_AWIN_COOKIE_DAYS);
  return Number.isInteger(days) && days > 0 ? Math.min(days, 365) : 30;
})();

/**
 * Our Awin advertiser id (MID). Only click ids of OUR programme are kept:
 * another programme's id could never attribute a sale here, and storing it
 * would overwrite a valid click of ours. Inlined at build time.
 */
export const AWIN_ADVERTISER_ID = (() => {
  const id = Number(process.env.NEXT_PUBLIC_AWIN_ADVERTISER_ID);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
})();

/**
 * Capture runs only when the build opts in (NEXT_PUBLIC_AWIN_ENABLED=true)
 * AND names the advertiser — the same rule as the API's `enabled`: without
 * the id, any programme's click would be accepted and could overwrite ours.
 */
export const AWIN_CAPTURE_ENABLED =
  process.env.NEXT_PUBLIC_AWIN_ENABLED === "true" && AWIN_ADVERTISER_ID !== null;

/** `<advertiserId>_<unix click seconds>_<hash>` — the only shape ever stored. */
const AWC_PATTERN = /^\d{1,12}_\d{9,12}_[A-Za-z0-9]{6,128}$/;
const AWC_MAX_LENGTH = 160;

export function normalizeAwc(
  value: unknown,
  advertiserId: number | null = AWIN_ADVERTISER_ID,
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > AWC_MAX_LENGTH) return null;
  if (!AWC_PATTERN.test(trimmed)) return null;
  if (advertiserId && !trimmed.startsWith(`${advertiserId}_`)) return null;
  return trimmed;
}

/** true = granted, false = denied, null = unknown. */
export function parseConsent(value: unknown): boolean | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "granted" || normalized === "true" || normalized === "1") return true;
  if (normalized === "denied" || normalized === "false" || normalized === "0") return false;
  return null;
}

/** `?sn=` present and not explicitly off. */
export function isStrictlyNecessary(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "false";
}

/**
 * Seconds the cookie should live: the programme window counted from the click
 * time Awin encoded in the id (falling back to now when that time is in the
 * future), or null when the click has already expired.
 */
export function clickMaxAgeSeconds(awc: string, nowMs: number = Date.now()): number | null {
  const clickSeconds = Number(awc.split("_")[1]);
  const nowSeconds = Math.floor(nowMs / 1000);
  const start =
    Number.isSafeInteger(clickSeconds) && clickSeconds > 0 && clickSeconds <= nowSeconds + 300
      ? clickSeconds
      : nowSeconds;
  const remaining = start + AWIN_COOKIE_DAYS * DAY_SECONDS - nowSeconds;
  return remaining > 0 ? remaining : null;
}

/**
 * Registrable domains the click cookie is shared on, so the marketing site,
 * this app and the API all see one cookie. Any other host (localhost, a
 * preview) gets a host-only cookie.
 */
const SHARED_COOKIE_DOMAINS = ["stafftimetracker.org", "stafftimetrack.com"] as const;

export function cookieDomainFor(host: string | null | undefined): string | undefined {
  const hostname = (host ?? "").split(":")[0].trim().toLowerCase();
  return SHARED_COOKIE_DOMAINS.find(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

/** The forwarding body the API expects; null when there is nothing to forward. */
export interface IAwinClickForward {
  awc?: string;
  awc_sn?: string;
  consent?: "granted" | "denied";
}

export function buildClickForward(cookies: {
  awc?: string | null;
  awcSn?: string | null;
  consent?: string | null;
}): IAwinClickForward | null {
  const consent = parseConsent(cookies.consent ?? undefined);
  const awc = consent === false ? null : normalizeAwc(cookies.awc);
  const awcSn = normalizeAwc(cookies.awcSn);
  // A denial is forwarded even without a click: it withdraws a stored one.
  if (!awc && !awcSn && consent !== false) return null;
  return {
    ...(awc ? { awc } : {}),
    ...(awcSn ? { awc_sn: awcSn } : {}),
    ...(consent === null ? {} : { consent: consent ? "granted" : "denied" }),
  };
}
