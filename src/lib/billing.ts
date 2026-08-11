import { format } from "date-fns";
import {
  BillingBlockCode,
  BillingStatusValue,
  IBillingEntitlements,
  IBillingPlan,
  InvoiceStatus,
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
    "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  active:
    "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  past_due: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  payment_failed:
    "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  pending_downgrade_selection:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  canceled:
    "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300",
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
