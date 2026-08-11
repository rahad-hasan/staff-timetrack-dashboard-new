/**
 * Billing / plans / seats types — shapes mirror the backend exactly
 * (docs/admin-dashboard-billing-guide.md). Two money units exist:
 *   - `*_cents` fields are integer cents straight from Stripe (7068 = $70.68)
 *   - plan seat prices (`seat_price_monthly` …) are dollars
 * The frontend never computes proration — it always displays server amounts.
 */

/** `entitlements.status`; `null` = legacy company with no subscription. */
export type BillingStatusValue =
  | "trialing"
  | "active"
  | "past_due"
  | "payment_failed"
  | "pending_downgrade_selection"
  | "canceled";

export const BILLING_CYCLES = ["monthly", "quarterly", "yearly"] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

/** Noun for one period, as it reads after "billed … per user / …". */
export const CYCLE_PERIOD_NOUN: Record<BillingCycle, string> = {
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

/** Server-derived pricing for one cycle. Absent/null = that cycle is not sold. */
export interface ICyclePricing {
  cycle: BillingCycle;
  /** Per seat, per period — exactly what Stripe charges. */
  seat_price: number;
  /** Per seat, per month — the comparable headline across cycles. */
  monthly_equivalent: number;
  /** Whole-percent saving vs paying monthly; null = none to advertise. */
  savings_percent: number | null;
}

/**
 * A pricing-card bullet with its condition already resolved server-side.
 *
 * `note` is the ⓘ tooltip text ("Up to 1 month history") and is rendered FROM
 * the plan's real limits when `note_source === "limit"` — never typed by hand —
 * so it cannot promise something the backend does not enforce. Do not recompute
 * it client-side.
 */
export interface IPlanFeature {
  label: string;
  note: string | null;
  note_source: "limit" | "custom" | null;
  limit_key: string | null;
  /**
   * False when the plan's limit switches the feature off (screenshots disabled,
   * a cap of 0). Must NOT render as a plain tick — the plan lacks it.
   */
  included: boolean;
}

/** Per-plan feature ceilings; `-1` means unlimited. */
export interface IPlanLimits {
  max_seats: number;
  max_projects: number;
  [key: string]: number | boolean | string | null | undefined;
}

export interface IBillingEntitlements {
  status: BillingStatusValue | null;
  /**
   * True only when a Stripe subscription backs the company. Free/downgraded
   * plans are `status: "active"` with NO Stripe subscription, so this — not
   * `status` — decides "switch plan" (mutation endpoints) vs "checkout".
   * Optional: entitlement snapshots cached before this field shipped omit it.
   */
  has_billing_subscription?: boolean;
  plan_id: number | null;
  plan_name: string | null;
  tier: string | null;
  billing_cycle: BillingCycle | null;
  /** Purchased seats; -1 = unlimited (trial/free). */
  seat_limit: number;
  limits: IPlanLimits | null;
  /** Only set while `status === "trialing"`. */
  trial_ends_at: string | null;
  current_period_end: string | null;
  pending_downgrade_plan_id: number | null;
  url_tracking?: boolean;
  cam_tracking?: boolean;
  last_payment_failure_reason?: string | null;
}

export type BillingBlockCode =
  | "SUBSCRIPTION_PAST_DUE"
  | "TRIAL_EXPIRED"
  | "SELECTION_REQUIRED"
  | "SUBSCRIPTION_CANCELED"
  | "SUBSCRIPTION_REQUIRED"
  | "SUBSCRIPTION_EXPIRED"
  | "COMPANY_DEACTIVATED";

export interface IBillingBlock {
  error: string;
  code: BillingBlockCode;
  message: string;
  actionRequired?: string;
  /** Always `/settings/billing` — every blocked screen links here. */
  webBillingUrl: string;
}

export type InvoiceStatus =
  | "paid"
  | "pending"
  | "unpaid"
  | "failed"
  | "refunded";

export interface IBillingInvoice {
  invoice_number: string;
  status: InvoiceStatus;
  total_cents: number;
  amount_due_cents: number;
  currency: string;
  period_start: string | null;
  period_end: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  paid_at?: string | null;
  billing_reason?: string | null;
  created_at?: string;
}

/** `GET /packages/billing/status` — the billing state machine. */
export interface IBillingStatus {
  entitlements: IBillingEntitlements | null;
  /**
   * Billable head count (active, not deleted) computed server-side with the
   * same rule the seat gate enforces — the seat-usage bar and the checkout
   * seat floor read this instead of counting a fetched member list.
   * Optional: older payloads omit it.
   */
  active_user_count?: number;
  blocked: boolean;
  block: IBillingBlock | null;
  /** Set during past_due / payment_failed — powers the "Pay now" card. */
  latest_unpaid_invoice: IBillingInvoice | null;
}

/** `GET /packages` row — public pricing display. Prices are dollars. */
export interface IBillingPlan {
  id: number;
  name: string;
  tier: string;
  description?: string | null;
  /**
   * The only prices a plan has: per seat, per cycle, in dollars, and exactly
   * what Stripe charges. 0 on a cycle means that cycle is not sold — never
   * "free".
   */
  seat_price_monthly: number | null;
  seat_price_quarterly: number | null;
  seat_price_yearly: number | null;
  /**
   * Derived server-side on every read (never stored, so they cannot disagree
   * with the prices above). `available_cycles` replaces the old
   * `billing_interval` enum — it is exactly the set of cycles priced above 0,
   * which is exactly the set with a Stripe price behind them. Filter pricing
   * cards on it; anything else offers a checkout that is guaranteed to fail.
   */
  available_cycles: BillingCycle[];
  cycle_pricing: Record<BillingCycle, ICyclePricing | null>;
  badge_text: string | null;
  features: IPlanFeature[] | null;
  limits?: IPlanLimits | null;
  is_active?: boolean;
  /** The auto-downgrade target (Free/Starter) — never sold via checkout. */
  is_default?: boolean;
  [key: string]: unknown;
}

/** `GET /packages/discount/list?plan=<id>` row (loose — display only). */
export interface IDiscountCode {
  id?: number;
  code: string;
  discount_percentage?: number | null;
  amount_off?: number | null;
  description?: string | null;
  [key: string]: unknown;
}

/* ---------------- checkout (§2) ---------------- */

export interface ICheckoutPayload {
  plan_id: number;
  seats: number;
  cycle: BillingCycle;
  discount_code?: string;
}

export interface ICheckoutSession {
  checkoutUrl: string;
  /** True ⇒ warn: "Your trial ends now and paid billing starts immediately." */
  trialWillEndImmediately: boolean;
}

/* ---------------- seats (§3) ---------------- */

export interface IQuoteLine {
  amount_cents: number;
  description: string;
  is_proration: boolean;
  period_start?: string;
  period_end?: string;
}

/** `POST /packages/subscription/seat-quote` — read-only preview, no charge. */
export interface ISeatQuote {
  seats_before: number;
  seats_after: number;
  seats_added: number;
  amount_due_cents: number;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  /** Negative amounts are discounts/credits. */
  lines: IQuoteLine[];
}

/** `PATCH /packages/subscription/add-seats` result — three outcomes, see guide §3. */
export interface IAddSeatsResult {
  quote: ISeatQuote;
  latest_invoice_status: "paid" | "open" | string | null;
  hosted_invoice_url: string | null;
  payment_intent_client_secret: string | null;
  payment_intent_status: string | null;
  pending_update: boolean;
  company_subscription: Record<string, unknown> | null;
}

/* ---------------- plan switch (§5) ---------------- */

export interface ISwitchPlanPayload {
  planId: number;
  /** Optional — omitting keeps the current quantity. */
  seats?: number;
  /** Optional — omitting keeps the current cycle. Changing it restarts the billing cycle today. */
  cycle?: BillingCycle;
}

export interface ISwitchPlanResult extends IAddSeatsResult {
  switched_to: { plan_id: number; plan_name: string; cycle: BillingCycle };
  applied_now: boolean;
}

/* ---------------- downgrade selection (§6) ---------------- */

export interface IDowngradeUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface IDowngradeProject {
  id: number;
  name: string;
  status: string;
  start_date: string | null;
  deadline: string | null;
}

/** `GET /packages/downgrade/preview` */
export interface IDowngradePreview {
  target_plan: {
    id: number;
    name: string;
    tier: string;
    limits: IPlanLimits;
  };
  needs_user_selection: boolean;
  max_seats: number;
  needs_project_selection: boolean;
  max_projects: number;
  active_users: IDowngradeUser[];
  active_projects: IDowngradeProject[];
}

export interface IDowngradeResolvePayload {
  keep_user_ids: number[];
  keep_project_ids: number[];
}

export interface IDowngradeResolveResult {
  subscription: Record<string, unknown> | null;
  parked_users: number;
  archived_projects: number;
}

/** `POST /packages/downgrade/restore` — restores oldest-parked first, up to the new caps. */
export interface IRestoreResult {
  restored_users: number;
  restored_projects: number;
  seat_cap: number;
  project_cap: number;
  still_parked_users: number;
  still_parked_projects: number;
}

/* ---------------- trial-end switch to free ---------------- */

/**
 * `POST /packages/downgrade/switch-to-free` — admin-initiated trial
 * downgrade. `downgraded` ⇒ the Free plan is live now; `selection_required`
 * ⇒ status flipped to pending_downgrade_selection and the owner picks what
 * stays (the DowngradeWizard takes over via billing status).
 */
export interface ISwitchToFreeResult {
  outcome: "downgraded" | "selection_required";
  plan: { id: number; name: string };
}

/* ---------------- cancel (§7) ---------------- */

export interface ICancelPayload {
  /** Default true: service continues until `current_period_end`. */
  at_period_end: boolean;
  /** ≤ 300 chars, stored for churn analytics. */
  reason?: string;
}
