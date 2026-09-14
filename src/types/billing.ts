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

/**
 * One row of `GET /packages/billing/invoices` — and also the shape
 * `billing/status` embeds as `latest_unpaid_invoice`.
 *
 * The status snapshot predates the invoice-document work and omits `id`,
 * `voided`, `amount_paid_cents` and `detail_path`, so those four are optional
 * here; every helper in `@/lib/invoice` treats their absence as "unknown", not
 * as `false`/`0`. List rows always carry them.
 */
export interface IBillingInvoice {
  /** Row id, and the `:id` of the detail endpoint. */
  id?: number;
  invoice_number: string;
  status: InvoiceStatus;
  total_cents: number;
  /** Server-derived (not the raw Stripe column) — already 0 for voided rows. */
  amount_due_cents: number;
  /** Server-derived companion of `amount_due_cents`. */
  amount_paid_cents?: number;
  /**
   * A voided invoice is not owed. Stripe maps `void` → our `refunded`, so
   * `status` alone CANNOT decide the badge — check this first, and suppress
   * every "Pay now" affordance when it is true.
   */
  voided?: boolean;
  /** Lowercase ISO code — uppercase it before handing it to Intl. */
  currency: string;
  period_start: string | null;
  period_end: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  paid_at?: string | null;
  billing_reason?: string | null;
  created_at?: string;
  /** Canonical detail URL, e.g. `/api/v1/packages/billing/invoices/412`. */
  detail_path?: string;
}

/* ---------------- invoice document (§3 of the integration guide) ---------------- */

/** Seller block — env-configured server-side, never hardcoded in the client. */
export interface IInvoiceSeller {
  name: string;
  product_name: string;
  address_lines: string[];
  phone: string | null;
  support_email: string | null;
}

export interface IInvoiceBillTo {
  name: string;
  company_id: number;
  address: string | null;
  email: string | null;
}

/**
 * One invoice line. Amounts are PRE-discount and PRE-tax (Stripe's model) —
 * the totals ladder is what reconciles them, so never sum these into a total.
 */
export interface IInvoiceLine {
  description: string | null;
  quantity: number | null;
  unit_amount_cents: number | null;
  /**
   * The line total, and the only amount safe to print: on a proration line
   * `quantity × unit_amount_cents` does NOT equal this, and it can be negative
   * (a credit).
   */
  amount_cents: number;
  currency: string;
  /** EPOCH SECONDS, not ISO — these come straight from Stripe. */
  period_start: number | null;
  period_end: number | null;
  proration: boolean;
}

/**
 * The authoritative money block. `total_cents === subtotal - discount + tax`,
 * and (when `lines_truncated === false`) `sum(lines[].amount_cents) ===
 * subtotal_cents`. Render this ladder; never recompute it from the lines.
 */
export interface IInvoiceTotals {
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_cents: number;
  amount_paid_cents: number;
  amount_remaining_cents: number;
  /** > 0 ⇒ money went back; Stripe still reports the invoice as fully paid. */
  refunded_cents: number;
}

/**
 * `GET /packages/billing/invoices/:id` — the list row plus everything the
 * printable document needs. The list-shaped money fields and `totals` are
 * computed by the same server helper, so they can never disagree: use either,
 * don't mix.
 */
export interface IBillingInvoiceDetail extends IBillingInvoice {
  id: number;
  /** Print THIS, not `created_at`. */
  date_of_issue: string | null;
  date_due: string | null;
  /** Null while unpaid — omit the row rather than printing a placeholder. */
  transaction_date: string | null;
  plan_name: string | null;
  /**
   * True ⇒ Stripe holds more lines than we snapshot (cap 20) and the lines
   * shown sum to LESS than `subtotal_cents`. Do not present them as a complete
   * itemisation.
   */
  lines_truncated: boolean;
  seller: IInvoiceSeller;
  bill_to: IInvoiceBillTo;
  lines: IInvoiceLine[];
  totals: IInvoiceTotals;
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
  /**
   * Admin-authored card tagline ("Best for growing teams"), rendered under the
   * plan name. Editorial only — it binds to no limit, so unlike a feature
   * bullet it promises nothing the backend has to enforce. `null` when unset;
   * optional because public-plan payloads cached before the field shipped omit
   * it entirely.
   */
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

/**
 * POST /packages/checkout/confirm — the success page hands the session_id
 * back so the backend syncs the subscription straight from Stripe instead of
 * waiting for webhook delivery. Idempotent; safe to retry.
 */
export interface ICheckoutConfirmResult {
  activated: boolean;
  checkout_status: "open" | "complete" | "expired" | null;
  payment_status: "paid" | "unpaid" | "no_payment_required" | null;
  subscription_status: BillingStatusValue | null;
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

/* ---------------- payment methods (custom checkout) ---------------- */

/**
 * One saved payment method, as Stripe holds it. We deliberately store NO card
 * data of our own — Stripe is the source of truth and this view is fetched
 * live, so a method changed in the Stripe dashboard can never disagree with
 * our UI.
 *
 * NOT ALWAYS A CARD — and that is permanent, not a migration artefact. The
 * SetupIntent behind "save a payment method" is created with
 * `automatic_payment_methods: { enabled: true }` and both the checkout and the
 * add-method drawer mount `<PaymentElement>`, so anything enabled on the Stripe
 * account can end up attached: a Link wallet in particular, which is then the
 * thing the subscription actually renews on. Listing only `type: "card"` is
 * what made the panel claim "No card saved" to a customer whose renewals were
 * going through fine. Every surface branches on `type`; nothing infers the kind
 * of method from `brand`.
 *
 * `brand`, `last4` and the two expiry numbers stay non-null empty-ish values
 * ("" / 0) on a method with no card object rather than becoming nullable: that
 * keeps every existing consumer type-compatible and leaves `type` as the single
 * thing that decides display. An expiry of 0 means there is NO expiry — never
 * render it, and never count it as "expiring".
 *
 * `type` and `wallet_email` are typed required because the wire contract is
 * agreed, but a cached/older API response can still arrive without them —
 * `resolvePaymentMethodType` in `@/lib/billing` is how every consumer reads
 * `type`, so such a response degrades to the card rendering it always had.
 *
 * `id` is a `pm_…` token, not a PAN. Nothing in this type is PCI-sensitive.
 */
export interface IPaymentMethod {
  id: string;
  /** Stripe's payment-method type: "card" | "link" | "us_bank_account" | … */
  type: string;
  /** Lowercase Stripe brand: "visa" | "mastercard" | … ; "" for a non-card. */
  brand: string;
  /** "" when the method exposes no last four (most wallets). */
  last4: string;
  /** 0 when the method has no expiry — i.e. on everything but a card. */
  exp_month: number;
  exp_year: number;
  funding: string | null;
  /** ISO-2 of the issuing country. */
  country: string | null;
  billing_name: string | null;
  /**
   * Link's `link.email` — the only thing that tells two Link wallets on the
   * same customer apart. Null on every other type.
   */
  wallet_email: string | null;
  is_default: boolean;
  /** Epoch seconds — used only for "newest first" ordering. */
  created: number;
}

/**
 * `GET /packages/billing/payment-methods`.
 *
 * A company that has never reached Stripe answers `customer_exists: false`
 * with an empty list rather than a 404 — "nothing saved yet" is a normal state
 * on the Change Card tab, not an error.
 */
export interface IPaymentMethodList {
  payment_methods: IPaymentMethod[];
  default_payment_method_id: string | null;
  customer_exists: boolean;
}

/**
 * `POST /packages/billing/payment-methods/setup-intent` — saving a card with
 * no charge. The client confirms this with `stripe.confirmSetup`; the secret
 * is single-use and must never be logged or put in a URL.
 */
export interface ISetupIntentResult {
  client_secret: string;
  setup_intent_id: string;
  customer_id: string;
}

/* ---------------- checkout quote ---------------- */

export interface IQuoteDiscount {
  code: string;
  label: string | null;
  type: "percentage" | "fixed_amount";
  value: number;
  /** The saving this code produces on THIS order, already computed server-side. */
  amount_cents: number;
}

/**
 * `POST /packages/checkout/quote` — the order summary panel's only data
 * source. Every amount is integer CENTS (unlike `IBillingPlan`'s dollar seat
 * prices), and the frontend displays them as received: it must never
 * recompute a total, because the invoice the user downloads later is built
 * from the same server ladder and the two would drift.
 *
 * `tax_cents` is 0 and `tax_rate_percent` is null until Stripe Tax is enabled
 * on the account — the VAT row is hidden rather than fabricated.
 */
export interface ICheckoutQuote {
  currency: string;
  seats: number;
  cycle: BillingCycle;
  plan: {
    id: number;
    name: string;
    tier: string;
    description: string | null;
    features: IPlanFeature[] | null;
  };
  seat_price_cents: number;
  subtotal_cents: number;
  discount: IQuoteDiscount | null;
  discount_cents: number;
  tax_cents: number;
  tax_rate_percent: number | null;
  total_cents: number;
  /** ISO — "Renews on 3 Oct, 2026". */
  renews_at: string | null;
  trial_will_end_immediately: boolean;
  /** Active billable head count; seats can never go below it. */
  seat_floor: number;
  /**
   * True ⇒ a live Stripe subscription already backs this company, so
   * "Activate Subscription" resolves to a prorated switch rather than a first
   * purchase. The subscribe endpoint branches on this internally; the client
   * only uses it for copy.
   */
  has_billing_subscription: boolean;
}

/* ---------------- subscribe (custom checkout) ---------------- */

export interface ISubscribePayload {
  plan_id: number;
  seats: number;
  cycle: BillingCycle;
  discount_code?: string;
  /** A saved `pm_…`. Omit to confirm with a freshly entered card instead. */
  payment_method_id?: string;
  save_payment_method?: boolean;
}

/**
 * `POST /packages/subscription/subscribe` and `/subscription/confirm`.
 *
 * The subscription is created with `payment_behavior: "default_incomplete"`,
 * so a decline leaves it `incomplete` with its invoice still open and the SAME
 * PaymentIntent re-confirmable — which is exactly what makes the design's "Try
 * Payment Again" safe. A retry must reuse `payment_intent_client_secret`, never
 * request a second subscription.
 */
export interface ISubscribeResult {
  subscription_id: string;
  status: string;
  requires_action: boolean;
  requires_payment_method: boolean;
  payment_intent_client_secret: string | null;
  payment_intent_status: string | null;
  latest_invoice_id: string | null;
  latest_invoice_status: string | null;
  hosted_invoice_url: string | null;
  /** Nothing left to confirm — go straight to the success screen. */
  already_active: boolean;
  /** The company already had a subscription, so this was a prorated switch. */
  switched: boolean;
}

export interface IConfirmSubscriptionResult extends ISubscribeResult {
  activated: boolean;
}

/* ---------------- invoice retry ---------------- */

/** `POST /packages/billing/invoices/:id/pay` — in-app retry of a failed charge. */
export interface IInvoicePayResult {
  status: string;
  paid: boolean;
  requires_action: boolean;
  payment_intent_client_secret: string | null;
  hosted_invoice_url: string | null;
}
