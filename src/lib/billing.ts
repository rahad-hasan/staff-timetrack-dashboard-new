import { format } from "date-fns";
import {
  BillingBlockCode,
  BillingStatusValue,
  IBillingEntitlements,
  IBillingPlan,
  InvoiceStatus,
  IPaymentMethod,
} from "@/types/billing";

/**
 * Billing display helpers. Money rule (guide §0): Stripe-derived amounts are
 * integer cents and are ALWAYS displayed as received — the frontend never
 * computes proration. Plan display prices are dollars.
 */

/** 7068 → "$70.68". Unknown currency codes fall back to a plain prefix. */
export const formatCents = (
  cents: number | null | undefined,
  currency: string = "usd",
): string => {
  if (cents === null || cents === undefined) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;
  }
};

/** Plan display price (dollars): 59 → "$59", 59.5 → "$59.50". */
export const formatDollars = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "—";
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
};

/** Billing dates are absolute calendar dates — "Feb 1, 2027". */
export const formatBillingDate = (
  iso: string | null | undefined,
): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : format(d, "MMM d, yyyy");
};

/** Whole days from now until `iso`, floored at 0 (trial countdown). */
export const daysUntil = (iso: string | null | undefined): number => {
  if (!iso) return 0;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
};

export const isDatePast = (iso: string | null | undefined): boolean =>
  !!iso && new Date(iso).getTime() < Date.now();

/* ---------------- exact backend messages the UI keys off ---------------- */

/**
 * `POST /auth/employees` seat-cap rejection — catch EXACTLY this message and
 * open the Add-seats dialog instead of showing a raw error (guide §3).
 */
export const SEAT_CAP_MESSAGE = "Upgrade your plan to add more seats.";

/**
 * Absolute seat ceiling for any order, independent of plan.
 *
 * THE single definition. This used to be re-declared in SeatSelectionDialog,
 * CheckoutDialog and OrderSummaryPanel, plus a bare `Math.min(500, …)` in the
 * checkout page — and only one of the four also consulted the plan's own cap,
 * so the same order was accepted or rejected depending on which door it came
 * through.
 */
export const MAX_ORDER_SEATS = 500;

/**
 * The largest seat count this plan can actually be sold at.
 *
 * `-1` is the repo's "unlimited" and a missing/0 cap means the plan carries no
 * ceiling of its own — in both cases MAX_ORDER_SEATS is the real limit.
 *
 * Every seat input must clamp with this, not with MAX_ORDER_SEATS alone: the
 * server rejects seats above the plan's `max_seats` on BOTH purchase paths, so
 * an input that ignores the cap lets someone be quoted and charged for seats
 * the entitlement engine will never grant. Callers also need it BEFORE opening
 * a seat dialog — a plan whose cap sits under the company's billable head
 * count cannot be bought at all, and auto-opening onto it is a dead end.
 */
export const seatCeilingFor = (plan: IBillingPlan): number => {
  const cap = plan.limits?.max_seats;
  if (typeof cap !== "number" || cap <= 0) return MAX_ORDER_SEATS;
  return Math.min(MAX_ORDER_SEATS, cap);
};

/** Project creation cap: `400 "Your plan allows up to N active project(s)…"` → prompt upgrade. */
export const isProjectCapMessage = (message: string | undefined): boolean =>
  !!message && /plan allows up to \d+ active project/i.test(message);

/** Where every blocked/upgrade CTA links (`block.webBillingUrl`). */
export const BILLING_URL = "/settings/billing";

/** Envelope check for the global 402 rule — writes during payment failure. */
export const isPaymentRequired = (res: {
  statusCode?: number;
  success?: boolean;
}): boolean => !res?.success && res?.statusCode === 402;

/* ---------------- status → UI maps ---------------- */

export const STATUS_LABELS: Record<BillingStatusValue, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  payment_failed: "Payment failed",
  pending_downgrade_selection: "Action required",
  canceled: "Canceled",
};

/** Tailwind classes for the small status chip, light + dark. */
export const STATUS_CHIP_STYLES: Record<BillingStatusValue, string> = {
  trialing:
    "bg-blue-50 text-blue-700 dark:bg-blue-500/15 border border-blue-500/20 dark:text-blue-300",
  active:
    "bg-green-50 text-green-700 dark:bg-green-500/15 border border-green-500/20 dark:text-green-300",
  past_due: "bg-red-50 text-red-700 dark:bg-red-500/15 border border-red-500/20 dark:text-red-300",
  payment_failed:
    "bg-red-50 text-red-700 dark:bg-red-500/15 border border-red-500/20 dark:text-red-300",
  pending_downgrade_selection:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 border border-amber-500/20 dark:text-amber-300",
  canceled:
    "bg-gray-100 text-gray-600 dark:bg-gray-500/15 border border-gray-500/20 dark:text-gray-300",
};

/** Invoice chips: paid green, pending/unpaid orange, failed red, refunded gray (guide §4). */
export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  paid: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  pending:
    "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  unpaid:
    "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  failed: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  refunded:
    "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300",
};

/** Friendly copy per gated-endpoint block code (guide §1). */
export const BLOCK_CODE_COPY: Record<
  BillingBlockCode,
  { title: string; description: string }
> = {
  SUBSCRIPTION_PAST_DUE: {
    title: "Payment issue",
    description:
      "Your last payment didn't go through. Settle the open invoice to restore full access.",
  },
  TRIAL_EXPIRED: {
    title: "Your trial has ended",
    description:
      "Choose a plan to keep using the dashboard — your data is all still here.",
  },
  SELECTION_REQUIRED: {
    title: "Action required",
    description:
      "Your trial ended over the Free plan's limits. Choose which members and projects stay active.",
  },
  SUBSCRIPTION_CANCELED: {
    title: "Subscription ended",
    description:
      "Your subscription has ended. Pick a plan to reactivate your workspace.",
  },
  SUBSCRIPTION_REQUIRED: {
    title: "Subscription required",
    description: "This workspace needs an active plan to continue.",
  },
  SUBSCRIPTION_EXPIRED: {
    title: "Subscription expired",
    description: "Your subscription has expired. Pick a plan to continue.",
  },
  COMPANY_DEACTIVATED: {
    title: "Company deactivated",
    description:
      "This company account has been deactivated. Contact support if you believe this is a mistake.",
  },
};

/* ---------------- seats ---------------- */

export interface SeatUsage {
  /** Effective cap: stricter of purchased `seat_limit` and plan `limits.max_seats`; null = unlimited. */
  cap: number | null;
  purchased: number | null;
  unlimited: boolean;
}

export const getSeatUsage = (
  entitlements: IBillingEntitlements | null | undefined,
): SeatUsage => {
  const seatLimit = entitlements?.seat_limit ?? -1;
  const maxSeats = entitlements?.limits?.max_seats ?? -1;
  const caps = [seatLimit, maxSeats].filter((n) => n !== -1);
  const cap = caps.length ? Math.min(...caps) : null;
  return {
    cap,
    purchased: seatLimit === -1 ? null : seatLimit,
    unlimited: cap === null,
  };
};

/**
 * A paid Stripe subscription is active ⇒ pricing cards say "Switch to this
 * plan" (switch-plan endpoint); otherwise "Get started" (checkout). Trials
 * have no Stripe subscription yet, so they go through checkout (guide §2/§6).
 *
 * `status === "active"` is NOT sufficient: the Free plan (trial auto-downgrade
 * or "Switch to Free") is also stored active but has no Stripe subscription,
 * and every mutation endpoint rejects it with "This action requires an active
 * paid Stripe subscription. Complete checkout first." Routing those companies
 * to switch-plan would dead-end their upgrade — the one path that restores
 * parked members. `has_billing_subscription` is the server's own gate
 * condition; entitlement snapshots cached before it shipped omit it, so those
 * keep the previous behavior until the TTL rolls — callers that hold the plans
 * list should compose this with `isOnFreePlan` for a cache-independent answer.
 */
export const hasPaidSubscription = (
  entitlements: IBillingEntitlements | null | undefined,
): boolean => {
  if (entitlements?.status !== "active") return false;
  return entitlements.has_billing_subscription ?? true;
};

/**
 * Cache-independent companion to `hasPaidSubscription`: resolves the company's
 * current plan against the freshly fetched plans list. The Free/default plan
 * is never Stripe-backed, so a company sitting on it must be routed to
 * checkout, never to the switch-plan / seat mutation endpoints.
 */
export const isOnFreePlan = (
  entitlements: IBillingEntitlements | null | undefined,
  plans: IBillingPlan[] | null | undefined,
): boolean => {
  const planId = entitlements?.plan_id;
  if (planId === null || planId === undefined || !plans?.length) return false;
  const current = plans.find((plan) => plan.id === planId);
  return !!current && isFreePlan(current);
};

/** True when plan mutations (switch-plan, add-seats) are actually available. */
export const canMutateSubscription = (
  entitlements: IBillingEntitlements | null | undefined,
  plans?: IBillingPlan[] | null,
): boolean =>
  hasPaidSubscription(entitlements) && !isOnFreePlan(entitlements, plans);

/**
 * The Free/default plan is applied by downgrade (trial expiry or
 * switch-to-free) — never sold through Stripe checkout, so pricing cards must
 * not offer a checkout CTA for it. `is_default` is authoritative; the
 * zero-price check covers plans seeded before that flag existed.
 */
export const isFreePlan = (plan: IBillingPlan): boolean =>
  plan.is_default === true || (plan.available_cycles?.length ?? 0) === 0;

/**
 * The subscription-wide inputs of `PlanCard`'s CTA state machine, shared by
 * every surface that renders the pricing grid (settings/billing and the
 * onboarding plan picker must never disagree on what a card offers).
 *
 * - `hasPaid`: a paid Stripe subscription is active ⇒ cards offer switch-plan;
 *   resolved against the live plans list because free-plan companies are
 *   stored `active` without a Stripe subscription and must route to checkout.
 * - `isCanceled`: a canceled subscription keeps its plan_id/billing_cycle, so
 *   the old plan still matches "current" — but there is nothing to keep or
 *   switch, and checkout is the only flow the backend accepts; the card must
 *   offer reactivation instead of a disabled "Current plan".
 * - `isTrial`: the trial lifecycle — trialing (running or expired) AND
 *   pending_downgrade_selection (expired over the Free plan's limits) — has no
 *   Stripe subscription behind it, and checkout is the one flow that converts
 *   it; the trialed plan's card offers "Upgrade now" instead of a disabled
 *   "Current plan".
 * - `isDelinquent`: while a payment failure is unresolved the Stripe
 *   subscription still exists, so the backend rejects both checkout ("already
 *   exists") and switch-plan — settling the open invoice is the only action
 *   that can succeed.
 */
export interface PlanGridFlags {
  hasPaid: boolean;
  isCanceled: boolean;
  isTrial: boolean;
  isDelinquent: boolean;
}

export const derivePlanGridFlags = (
  entitlements: IBillingEntitlements | null | undefined,
  plans: IBillingPlan[] | null | undefined,
): PlanGridFlags => ({
  hasPaid: canMutateSubscription(entitlements, plans),
  isCanceled: entitlements?.status === "canceled",
  isTrial:
    entitlements?.status === "trialing" ||
    entitlements?.status === "pending_downgrade_selection",
  isDelinquent:
    entitlements?.status === "past_due" ||
    entitlements?.status === "payment_failed",
});

/* ---------------- saved payment methods ---------------- */

/**
 * A saved payment method is not necessarily a CARD.
 *
 * The SetupIntent behind every "save a payment method" flow is created with
 * `automatic_payment_methods: { enabled: true }` and the forms mount
 * `<PaymentElement>`, so whatever the Stripe account has enabled can be
 * attached — a Link wallet above all. Those methods carry no card object, so
 * `brand`/`last4` arrive as "" and the expiry as 0/0, and every helper below
 * branches on `type` rather than printing a card sentence over empty values.
 * This is a permanent shape, not a migration artefact.
 */

/** Stripe card-brand slug → the label printed on the card. Cards only. */
const CARD_BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
  eftpos_au: "Eftpos",
};

export const formatCardBrand = (brand: string | null | undefined): string => {
  if (!brand) return "Card";
  return CARD_BRAND_LABELS[brand.toLowerCase()] ?? brand.toUpperCase();
};

/**
 * Stripe payment-method type → the noun we show. Only the types this account
 * can realistically attach need an entry; anything else is humanised from the
 * slug, so a newly enabled method reads sensibly the day it first appears
 * instead of waiting for a frontend release.
 */
const PAYMENT_METHOD_TYPE_LABELS: Record<string, string> = {
  card: "Card",
  link: "Link",
  us_bank_account: "Bank account",
  sepa_debit: "SEPA Direct Debit",
  bacs_debit: "Bacs Direct Debit",
  acss_debit: "Pre-authorized debit",
  au_becs_debit: "BECS Direct Debit",
  cashapp: "Cash App Pay",
  paypal: "PayPal",
  amazon_pay: "Amazon Pay",
  revolut_pay: "Revolut Pay",
  klarna: "Klarna",
  affirm: "Affirm",
  afterpay_clearpay: "Afterpay / Clearpay",
  alipay: "Alipay",
  wechat_pay: "WeChat Pay",
  paynow: "PayNow",
  boleto: "Boleto",
};

/** "us_bank_account" → "Bank account"; "foo_bar" → "Foo Bar". */
export const formatPaymentMethodType = (
  type: string | null | undefined,
): string => {
  const key = (type ?? "").trim().toLowerCase();
  if (!key) return "Payment method";
  return (
    PAYMENT_METHOD_TYPE_LABELS[key] ??
    key
      .split(/[_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

/** The subset of a payment method the display helpers actually read. */
type PaymentMethodLike = Partial<
  Pick<
    IPaymentMethod,
    "type" | "brand" | "last4" | "exp_month" | "exp_year" | "wallet_email"
  >
>;

/**
 * The method's type, resolved defensively — the ONE place `type` is read.
 *
 * The field is part of the agreed wire contract and typed required, but a
 * response cached before it shipped still has none at runtime. Those responses
 * can only ever describe cards (the backend listed with `type: "card"` back
 * then), so a row with card data falls back to "card" and renders exactly as it
 * always did. A row with nothing to go on resolves to "" — `formatPaymentMethodType`
 * turns that into the neutral "Payment method" rather than inventing a brand.
 */
export const resolvePaymentMethodType = (
  method: PaymentMethodLike | null | undefined,
): string => {
  const declared = (method?.type ?? "").trim().toLowerCase();
  if (declared) return declared;
  const brand = (method?.brand ?? "").trim().toLowerCase();
  if (brand === "link") return "link";
  return brand || method?.last4 ? "card" : "";
};

/** True ⇒ the card layouts (masked PAN, expiry, cardholder) actually apply. */
export const isCardMethod = (
  method: PaymentMethodLike | null | undefined,
): boolean => resolvePaymentMethodType(method) === "card";

/**
 * Does this method have an expiry at all? Non-card methods send 0/0, and an
 * "Expires —" line under a Link wallet is the same lie as "Unknown Ending in".
 */
export const hasExpiry = (
  method: PaymentMethodLike | null | undefined,
): boolean => Boolean(method?.exp_month && method?.exp_year);

/**
 * The one-line name of a saved method, used as the row title everywhere.
 *
 * A card keeps the exact "Visa Ending in 4242" phrasing the surrounding copy is
 * written around. A Link wallet is identified by the email it belongs to, which
 * is the only thing that distinguishes two Link methods on the same customer.
 * Anything else falls back to its humanised type, plus a last four when the
 * method exposes one (bank debits do).
 */
export const describePaymentMethod = (
  method: PaymentMethodLike | null | undefined,
): string => {
  if (!method) return "No payment method on file";

  const type = resolvePaymentMethodType(method);
  const isCard = type === "card";
  const label = isCard
    ? formatCardBrand(method.brand)
    : formatPaymentMethodType(type);

  const email = (method.wallet_email ?? "").trim();
  if (!isCard && email) return `${label} — ${email}`;

  const last4 = (method.last4 ?? "").trim();
  if (last4) return `${label} Ending in ${last4}`;

  // No digits to quote — a bare "Visa Ending in " is worse than just "Visa".
  return label;
};

/**
 * "08/2028", zero-padded — matches the VALID THRU line on the card visual.
 *
 * The "—" is for a card whose expiry genuinely failed to come through. Callers
 * must gate on `hasExpiry` first, so a method that has no expiry by nature
 * never reaches here to be rendered as a dash.
 */
export const formatCardExpiry = (
  month: number | null | undefined,
  year: number | null | undefined,
): string => {
  if (!month || !year) return "—";
  return `${String(month).padStart(2, "0")}/${year}`;
};

/**
 * True once the card is in its final month or already past it.
 *
 * Stripe treats a card as valid through the LAST day of its expiry month, so
 * the comparison is month-granular — treating the 1st as expired would warn a
 * user about a card that still works for another four weeks.
 *
 * The falsy guard is load-bearing now that non-card methods exist: they arrive
 * with `exp_month`/`exp_year` of 0, and 0 is falsy, so they answer "not
 * expiring" rather than being scored against `new Date(0, 0, 0)` — which is
 * the year 1899 and would flag every wallet as expired.
 */
export const isCardExpiring = (
  month: number | null | undefined,
  year: number | null | undefined,
): boolean => {
  if (!month || !year) return false;
  const now = new Date();
  const expiry = new Date(year, month, 0, 23, 59, 59, 999);
  const oneMonthOut = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return expiry <= oneMonthOut;
};

/* ---------------- payment failures ---------------- */

export interface PaymentFailureCopy {
  title: string;
  description: string;
  /** Rendered as "Error code: …" under the message, as in the design. */
  code: string;
  /** True ⇒ the same card can plausibly work on a retry (issuer/network blip). */
  retryable: boolean;
}

/**
 * One decline, two stories.
 *
 * The same Stripe error codes arrive from two different flows: the checkout and
 * pay-now surfaces confirm a PaymentIntent (money moves), while the change-card
 * drawer confirms a zero-amount SetupIntent (nothing is charged — the card is
 * only being stored for later). "Payment unsuccessful … Error code: Card
 * declined" is the truth on the first and a lie on the second: it tells an admin
 * a charge failed on a card that was never charged.
 *
 * So the failure knowledge lives in ONE table keyed by the Stripe code, and each
 * entry carries both phrasings. The "Error code" chip and the `retryable`
 * verdict are properties of the decline itself, so they are shared; only the
 * sentences differ. Adding a code adds it to both variants in the same edit —
 * the two cannot drift apart or end up covering different sets of failures.
 */
type FailureIntent = "payment" | "setup";

interface FailureWording {
  title: string;
  description: string;
}

interface CardFailureEntry {
  /** Stripe codes that share this decline (`decline_code` or `code`). */
  keys: readonly string[];
  /** Rendered as "Error code: …" — names the decline, not what we attempted. */
  code: string;
  retryable: boolean;
  payment: FailureWording;
  setup: FailureWording;
}

const CARD_FAILURES: readonly CardFailureEntry[] = [
  {
    keys: ["insufficient_funds"],
    code: "Insufficient funds",
    retryable: false,
    payment: {
      title: "Payment unsuccessful",
      description:
        "Your card was declined for insufficient funds. Try another payment method.",
    },
    setup: {
      title: "Card not saved",
      description:
        "Your bank declined this card for insufficient funds. Try adding a different card.",
    },
  },
  {
    keys: ["expired_card"],
    code: "Expired card",
    retryable: false,
    payment: {
      title: "Payment unsuccessful",
      description:
        "That card has expired. Please update the expiry date or use another card.",
    },
    setup: {
      title: "Card not saved",
      description:
        "That card has expired. Please update the expiry date or add another card.",
    },
  },
  {
    keys: ["incorrect_cvc", "invalid_cvc"],
    code: "Incorrect CVC",
    retryable: true,
    payment: {
      title: "Payment unsuccessful",
      description:
        "The security code did not match. Please check the CVV and try again.",
    },
    setup: {
      title: "Card not saved",
      description:
        "The security code did not match. Please check the CVV and try again.",
    },
  },
  {
    keys: ["incorrect_number", "invalid_number"],
    code: "Invalid card number",
    retryable: true,
    payment: {
      title: "Payment unsuccessful",
      description:
        "That card number is not valid. Please check it and try again.",
    },
    setup: {
      title: "Card not saved",
      description:
        "That card number is not valid. Please check it and try again.",
    },
  },
  {
    keys: ["processing_error"],
    code: "Processing error",
    retryable: true,
    payment: {
      title: "Payment unsuccessful",
      description:
        "Your bank could not process the payment just now. Trying again usually works.",
    },
    setup: {
      title: "Card not saved",
      description:
        "Your bank could not check this card just now. Trying again usually works.",
    },
  },
  {
    keys: ["authentication_required"],
    code: "Authentication required",
    retryable: true,
    payment: {
      title: "Extra verification needed",
      description:
        "Your bank needs to verify this payment. Try again to complete the check.",
    },
    setup: {
      // A SetupIntent can require 3-D Secure too — the bank verifies the card
      // itself, with no amount attached, so the prompt must not promise one.
      title: "Extra verification needed",
      description:
        "Your bank needs to verify this card. Try again to complete the check.",
    },
  },
  {
    keys: ["card_not_supported", "currency_not_supported"],
    code: "Card not supported",
    retryable: false,
    payment: {
      title: "Payment unsuccessful",
      description:
        "That card cannot be used for this purchase. Please try another payment method.",
    },
    setup: {
      title: "Card not saved",
      description:
        "That card cannot be saved for future billing. Please try another card.",
    },
  },
  {
    // Stripe deliberately returns a generic decline for these so the UI does
    // not tell a card thief why it failed. Match that — say nothing specific.
    keys: ["lost_card", "stolen_card", "pickup_card"],
    code: "Card declined",
    retryable: false,
    payment: {
      title: "Payment unsuccessful",
      description:
        "Your bank declined this payment. Please check your card details or try another payment method",
    },
    setup: {
      title: "Card not saved",
      description:
        "Your bank declined this card. Please check your card details or try another card",
    },
  },
];

const CARD_FAILURE_LOOKUP: Record<string, CardFailureEntry> =
  Object.fromEntries(
    CARD_FAILURES.flatMap((entry) =>
      entry.keys.map((key) => [key, entry] as const),
    ),
  );

/** Wording for a code the table does not know, per flow. */
const FALLBACK_FAILURES: Record<FailureIntent, FailureWording> = {
  payment: {
    title: "Payment unsuccessful",
    description:
      "Your bank declined this payment. Please check your card details or try another payment method",
  },
  setup: {
    title: "Card not saved",
    description:
      "Your bank declined this card. Please check your card details or try another card",
  },
};

/**
 * Stripe's own `message` is usually the most specific thing we have, so the
 * fallback prefers it over our generic line — but it is written for whichever
 * intent produced it. On the save-a-card flow any charge wording would
 * reintroduce exactly the lie this split exists to kill, so such a message is
 * dropped in favour of our neutral sentence.
 */
const CHARGE_WORDING = /payment|charg|purchas/i;

/**
 * Shared resolver behind both public mappers.
 *
 * `decline_code` is the specific reason and is only present on `card_declined`;
 * `code` is the broader error class. Preferring the specific one lets
 * "insufficient_funds" say so instead of the generic bank-declined line, which
 * is the difference between a user who knows to try another card and one who
 * retries the same one four times.
 *
 * Anything unrecognised falls back to the design's default wording rather than
 * surfacing a raw Stripe string.
 */
const resolveCardFailure = (
  intent: FailureIntent,
  code: string | null | undefined,
  declineCode: string | null | undefined,
  message: string | null | undefined,
): PaymentFailureCopy => {
  const key = (declineCode || code || "").toLowerCase();
  const entry = CARD_FAILURE_LOOKUP[key];

  if (entry) {
    return { ...entry[intent], code: entry.code, retryable: entry.retryable };
  }

  const fallback = FALLBACK_FAILURES[intent];
  const specific =
    message && (intent === "payment" || !CHARGE_WORDING.test(message))
      ? message
      : null;

  return {
    title: fallback.title,
    description: specific || fallback.description,
    code: "Card declined",
    retryable: true,
  };
};

/**
 * Maps a Stripe decline into the alert copy the checkout and pay-now surfaces
 * show — flows where a real charge was attempted, so "Payment unsuccessful" is
 * accurate. Card-on-file flows want `mapSetupFailure` instead.
 */
export const mapPaymentFailure = (
  code: string | null | undefined,
  declineCode?: string | null,
  message?: string | null,
): PaymentFailureCopy =>
  resolveCardFailure("payment", code, declineCode, message);

/**
 * The same decline, worded for confirming a zero-amount SetupIntent (the
 * change-card drawer / add-a-payment-method form). Nothing is charged there, so
 * the copy only ever talks about the card being saved or verified — identical
 * shape to `mapPaymentFailure`, so the failure panel renders it unchanged.
 */
export const mapSetupFailure = (
  code: string | null | undefined,
  declineCode?: string | null,
  message?: string | null,
): PaymentFailureCopy => resolveCardFailure("setup", code, declineCode, message);

/**
 * A failure that never reached the card network.
 *
 * The server refused the request (seat floor, plan not sold on this cycle, a
 * 500), or Stripe.js had not loaded yet. Routing these through
 * `mapPaymentFailure` labelled every one of them "Payment unsuccessful … Error
 * code: Card declined" — which sent admins to re-check a perfectly good card,
 * and their support tickets to the wrong place — because the card fallback
 * hardcodes that code for anything it does not recognise.
 *
 * `code: ""` suppresses the "Error code" line entirely (see
 * PaymentFailureAlert), and these are retryable by definition: nothing was
 * charged, so pressing the button again is safe.
 */
export const mapRequestFailure = (message?: string | null): PaymentFailureCopy => ({
  title: "We couldn't start this payment",
  description: message || "Something went wrong. Please try again.",
  code: "",
  retryable: true,
});
