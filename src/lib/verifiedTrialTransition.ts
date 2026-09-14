import { BILLING_CYCLES, type BillingCycle } from "@/types/billing";
import type { MarketingPlanIntent } from "@/lib/marketingPlanIntent";

const TRANSITION_KEY = "stt:verified-trial-transition:v1";
const MAX_AGE_MS = 120_000;

/** Longest name worth carrying. The API already caps account names at 30
 * characters and the org-name suggestions clamp to 50, so this bound exists
 * only to stop a hand-edited record from being arbitrarily large. */
const MAX_NAME_LENGTH = 100;

/**
 * Everything the OTP screen holds that exists nowhere else once it unmounts,
 * carried across the full-document hop through `/auth/signup-verified`.
 *
 * `id`/`email`/`createdAt` are the tracking record. `name` and the plan intent
 * are onboarding context that has no other carrier: the next screen has no
 * session to look the name up with, and a plan picked before signup only ever
 * existed on the OTP screen's URL. They ride here because the tracking page
 * must stay query-string-free — see `isSafeDocument` in
 * `@/lib/verifiedTrialGoogleAds`, which refuses to fire the conversion,
 * silently, if `window.location.search` is non-empty.
 *
 * The intent is stored as PRIMITIVES — never a path, a URL or a prebuilt query
 * string. sessionStorage is user-editable and whatever comes out of here ends
 * up in a `window.location.replace`, so the destination is rebuilt from a
 * literal path plus values re-serialised by `marketingPlanIntentQuery`, whose
 * output alphabet is closed to `plan=<digits>`, `cycle=<one of three>` and
 * `trial=true`. Open redirects and param injection are then impossible by
 * construction rather than by validation.
 *
 * Every added field is optional on BOTH sides. The hop is a full-document
 * navigation, so a record written by the previous deploy is read by the next
 * one — and a rejected record sends a just-verified user to `/auth/login`,
 * which is a worse outcome than the params it would have been protecting. That
 * is also why the storage key is deliberately NOT versioned past v1.
 */
export type Transition = {
  id: string;
  email: string;
  createdAt: number;
  name?: string;
  planId?: number;
  cycle?: BillingCycle;
  isTrial?: boolean;
};

/** The onboarding context the OTP screen hands over with the tracking id. */
export interface VerifiedTrialOnward {
  name?: string | null;
  intent?: MarketingPlanIntent | null;
}

const isCycle = (value: unknown): value is BillingCycle =>
  typeof value === "string" && (BILLING_CYCLES as readonly string[]).includes(value);

const isPlanId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

function validContext(value: unknown, now: number): value is Transition {
  if (!value || typeof value !== "object") return false;
  const context = value as Partial<Transition>;
  return typeof context.id === "string" && /^stt_otp_[a-f0-9]{64}$/.test(context.id)
    && typeof context.email === "string" && context.email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(context.email)
    && typeof context.createdAt === "number" && Number.isFinite(context.createdAt)
    && context.createdAt <= now && now - context.createdAt <= MAX_AGE_MS
    // Optional-or-valid, never required — a record written by the previous
    // deploy carries none of these and must still validate.
    && (context.name === undefined
      || (typeof context.name === "string"
        && context.name.length > 0 && context.name.length <= MAX_NAME_LENGTH))
    && (context.planId === undefined || isPlanId(context.planId))
    && (context.cycle === undefined || isCycle(context.cycle))
    && (context.isTrial === undefined || typeof context.isTrial === "boolean");
}

/** Functional onboarding context, same-tab only, short-lived, never analytics.
 * Contains no OTP, password or token. The API still authorizes company creation.
 *
 * `onward` is sanitised INTO the record rather than validated out of it. This
 * function is all-or-nothing and a `false` return skips `/auth/signup-verified`
 * altogether, so a malformed name or a junk plan id has to be dropped here —
 * letting it reach `validContext` would cost that signup its conversion with no
 * error anywhere.
 */
export function storeVerifiedTrialTransition(
  id: unknown,
  email: unknown,
  onward?: VerifiedTrialOnward,
): boolean {
  if (typeof window === "undefined") return false;
  const context: Record<string, unknown> = { id, email, createdAt: Date.now() };

  const name = typeof onward?.name === "string" ? onward.name.trim() : "";
  if (name && name.length <= MAX_NAME_LENGTH) context.name = name;

  // Mirrors `marketingPlanIntentQuery` exactly: a cycle only travels alongside a
  // plan, and the trial flag only when it is on. Keeping this record's alphabet
  // identical to the query's is what lets both hops build the same URL.
  const intent = onward?.intent;
  if (intent && isPlanId(intent.planId)) {
    context.planId = intent.planId;
    if (isCycle(intent.cycle)) context.cycle = intent.cycle;
  }
  if (intent?.isTrial === true) context.isTrial = true;

  if (!validContext(context, Date.now())) return false;
  try {
    const serialized = JSON.stringify(context);
    window.sessionStorage.setItem(TRANSITION_KEY, serialized);
    return window.sessionStorage.getItem(TRANSITION_KEY) === serialized;
  } catch { return false; }
}

export function readVerifiedTrialTransition(): Transition | null {
  if (typeof window === "undefined") return null;
  try {
    const context = JSON.parse(window.sessionStorage.getItem(TRANSITION_KEY) || "null");
    if (validContext(context, Date.now())) return context;
    clearVerifiedTrialTransition();
  } catch { /* Fail closed without preventing ordinary signup. */ }
  return null;
}

/** The stored intent, back in the shape `appendMarketingPlanIntent` expects. */
export function verifiedTrialPlanIntent(context: Transition): MarketingPlanIntent {
  return {
    planId: context.planId ?? null,
    cycle: context.cycle ?? null,
    isTrial: context.isTrial ?? false,
  };
}

export function clearVerifiedTrialTransition(): void {
  try { window.sessionStorage.removeItem(TRANSITION_KEY); } catch { /* optional */ }
}
