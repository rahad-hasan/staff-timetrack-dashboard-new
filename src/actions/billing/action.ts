"use server";

import { baseApi } from "../baseApi";
import { IResponse } from "@/types/type";
import {
  BillingCycle,
  IAddSeatsResult,
  IBillingInvoice,
  IBillingInvoiceDetail,
  IBillingPlan,
  IBillingStatus,
  ICancelPayload,
  ICheckoutConfirmResult,
  ICheckoutQuote,
  IConfirmSubscriptionResult,
  IInvoicePayResult,
  IPaymentMethodList,
  ISetupIntentResult,
  ISubscribePayload,
  ISubscribeResult,
  IDowngradePreview,
  IDowngradeResolvePayload,
  IDowngradeResolveResult,
  IRestoreResult,
  ISeatQuote,
  ISwitchPlanPayload,
  ISwitchPlanResult,
  ISwitchToFreeResult,
} from "@/types/billing";

/**
 * Billing actions (docs/admin-dashboard-billing-guide.md). All mutations are
 * company-admin only; `getBillingStatus` / `getBillingInvoices` are also
 * readable by manager / hr. Errors come back as the standard envelope
 * `{ success: false, message, errorMessages }` (+ `statusCode` from baseApi) —
 * billing dialogs surface `message` inline rather than throwing.
 *
 * The status endpoint is the billing state machine: re-read it after EVERY
 * billing action (`useBillingRefresh`).
 *
 * ## Freshness
 *
 * Every read here is live, like every `baseApi` read without `cacheFor` —
 * Stripe webhooks change billing state with nobody touching this app.
 *
 * Writes come in two kinds, and the split is deliberate:
 *
 * - `SUBSCRIPTION_WRITE` — writes that change the subscription itself. They
 *   revalidate the `billing` tag, which makes Next re-render the current
 *   route, layouts included, into the action's own response: whatever page
 *   the dialog sits on (a members list a downgrade just parked, the billing
 *   page's server props) comes back fresh in the same round trip, and Next
 *   drops its client router cache, so Back cannot restore a pre-write page.
 *   Callers follow up with `useBillingRefresh` for the client-held state that
 *   render does not reach — never with `router.refresh()`, which would render
 *   the whole route a second time.
 * - Everything else — card management, the checkout steps, refund requests,
 *   the price quotes — owns its client state and often runs mid-flow, where a
 *   whole-route re-render is pure cost (on /billing/checkout it re-ran the
 *   plans, status and quote reads between `subscribe` and `confirmPayment`).
 *   These carry no tag.
 */
const BASE = "/packages";
const SUBSCRIPTION_WRITE = { tag: "billing" } as const;

export const getBillingStatus = async (): Promise<IResponse<IBillingStatus>> =>
  await baseApi(`${BASE}/billing/status`);

/** Public pricing list — active plans with display pricing (dollars). */
export const getPlans = async (): Promise<IResponse<IBillingPlan[]>> =>
  await baseApi(`${BASE}`);

/**
 * Post-checkout activation — /billing/success passes the session_id from the
 * Stripe redirect; the backend pulls the session from Stripe and runs the same
 * sync the webhook would. Makes activation independent of webhook delivery.
 *
 * Untagged: the success page retries this every few seconds and is entirely
 * client-driven, so a route re-render per attempt would buy nothing. The page
 * hands the activated status to the billing store itself.
 */
export const confirmCheckout = async (
  sessionId: string,
): Promise<IResponse<ICheckoutConfirmResult>> =>
  await baseApi(`${BASE}/checkout/confirm`, {
    method: "POST",
    body: { session_id: sessionId },
  });

/** Step 1 of add-seats — read-only proration preview, no charge. ALWAYS quote first. */
export const getSeatQuote = async (
  seats: number,
): Promise<IResponse<ISeatQuote>> =>
  await baseApi(`${BASE}/subscription/seat-quote`, {
    method: "POST",
    body: { seats },
    // Same shape as the checkout quote: a POST that only reads. Today it is
    // only ever called from the client, but marking it keeps it safe to
    // server-render should anyone ever give it a tag.
    skipRevalidate: true,
  });

/** Step 2 of add-seats — confirm. Three outcomes: paid / pending payment / 400 blocked. */
export const addSeats = async (
  seats: number,
): Promise<IResponse<IAddSeatsResult>> =>
  await baseApi(`${BASE}/subscription/add-seats`, {
    method: "PATCH",
    body: { seats },
    ...SUBSCRIPTION_WRITE,
  });

/**
 * Prorated plan switch. Upgrades charge the difference now; downgrades credit
 * it. Switching monthly ↔ yearly restarts the billing cycle from today.
 */
export const switchPlan = async (
  payload: ISwitchPlanPayload,
): Promise<IResponse<ISwitchPlanResult>> =>
  await baseApi(`${BASE}/subscription/switch-plan`, {
    method: "PATCH",
    body: payload,
    ...SUBSCRIPTION_WRITE,
  });

export const getBillingInvoices = async (
  query: { page?: number; limit?: number } = {},
): Promise<IResponse<IBillingInvoice[]>> =>
  await baseApi(`${BASE}/billing/invoices`, { query });

/**
 * `GET /packages/billing/invoices/:id` — the invoice document payload.
 *
 * Tenant-scoped server-side: another company's id answers 404, so there is no
 * ownership check to duplicate here. Live like every other billing read — an
 * invoice that is still settling must never be served from a stale snapshot.
 * Nothing memoises it on the client either: each visit to the invoice page
 * reads it again.
 */
export const getBillingInvoiceDetail = async (
  id: number,
): Promise<IResponse<IBillingInvoiceDetail>> =>
  await baseApi(`${BASE}/billing/invoices/${id}`);

/** 5xx and transport failures are the only statuses worth a second attempt. */
const isRetryableStatus = (statusCode: number | undefined): boolean =>
  statusCode === undefined || statusCode >= 500;

/**
 * Invoice detail with the guide's §6 retry policy: one automatic retry on 5xx
 * (or a dead connection), then the envelope is returned as-is so the caller can
 * render a retry button instead of a half-empty document. 4xx is never retried
 * — 400/404 mean "not found" and will not change on a second call.
 */
export const getBillingInvoiceDetailWithRetry = async (
  id: number,
): Promise<IResponse<IBillingInvoiceDetail>> => {
  const first = await getBillingInvoiceDetail(id);
  if (first?.success || !isRetryableStatus(first?.statusCode)) return first;
  return await getBillingInvoiceDetail(id);
};

/**
 * "Switch to Free" from the trial-expired screen. Fits limits ⇒ instant
 * downgrade; over ⇒ `selection_required` (status flips to
 * pending_downgrade_selection and the wizard takes over). Admin only.
 */
export const switchToFreePlan = async (): Promise<
  IResponse<ISwitchToFreeResult>
> =>
  await baseApi(`${BASE}/downgrade/switch-to-free`, {
    method: "POST",
    body: {},
    ...SUBSCRIPTION_WRITE,
  });

/** Over-limit trial expiry — what the owner must choose between. */
export const getDowngradePreview = async (): Promise<
  IResponse<IDowngradePreview>
> =>
  await baseApi(`${BASE}/downgrade/preview`);

export const resolveDowngrade = async (
  payload: IDowngradeResolvePayload,
): Promise<IResponse<IDowngradeResolveResult>> =>
  await baseApi(`${BASE}/downgrade/resolve`, {
    method: "POST",
    body: payload,
    ...SUBSCRIPTION_WRITE,
  });

/** After a later upgrade — restores oldest-parked first, up to the new caps. */
export const restoreParked = async (): Promise<IResponse<IRestoreResult>> =>
  await baseApi(`${BASE}/downgrade/restore`, {
    method: "POST",
    body: {},
    ...SUBSCRIPTION_WRITE,
  });

/**
 * Cancel. `at_period_end: true` (default) keeps service until period end;
 * `false` stops tracking for the whole team immediately — the UI requires a
 * typed confirmation for that one.
 */
export const cancelSubscription = async (
  payload: ICancelPayload,
): Promise<IResponse<{ [key: string]: unknown }>> =>
  await baseApi(`${BASE}/subscription/cancel`, {
    method: "DELETE",
    body: payload,
    ...SUBSCRIPTION_WRITE,
  });

/* ---------------- payment methods + custom checkout ---------------- */

/**
 * The payment surfaces opt out of the global non-GET `402 → /settings/billing`
 * redirect. Those endpoints ARE the way out of a payment block, so bouncing
 * them would eject the admin from a half-confirmed payment. They render the
 * envelope inline instead.
 *
 * Untagged (see "Freshness" above): the card list answers every write with
 * the full post-write list, and the checkout steps hand over to
 * /billing/success, so none of them needs the route re-rendered — least of all
 * between `subscribe` and `confirmPayment`.
 *
 * NOTHING in this section ever carries card data. Card number, expiry and CVV
 * are entered into Stripe-hosted iframes and confirmed from the browser with
 * Stripe.js — a PAN must never reach a server action, which is what keeps the
 * API out of PCI scope.
 */
const PAYMENT_OPTS = {
  skipPaymentRedirect: true,
} as const;

/** Saved cards, read live from Stripe — we store none of our own. */
export const getPaymentMethods = async (): Promise<
  IResponse<IPaymentMethodList>
> => await baseApi(`${BASE}/billing/payment-methods`);

/**
 * Saving a card with no charge. The returned `client_secret` is single-use and
 * is confirmed by `stripe.confirmSetup` in the browser — never log it, never
 * put it in a URL.
 */
export const createSetupIntent = async (): Promise<
  IResponse<ISetupIntentResult>
> =>
  await baseApi(`${BASE}/billing/payment-methods/setup-intent`, {
    method: "POST",
    body: {},
    ...PAYMENT_OPTS,
  });

export const setDefaultPaymentMethod = async (
  paymentMethodId: string,
): Promise<IResponse<IPaymentMethodList>> =>
  await baseApi(`${BASE}/billing/payment-methods/default`, {
    method: "POST",
    body: { payment_method_id: paymentMethodId },
    ...PAYMENT_OPTS,
  });

/**
 * Detaching is refused server-side when it would remove the last card behind a
 * live paid subscription — otherwise the next renewal fails silently.
 */
export const detachPaymentMethod = async (
  paymentMethodId: string,
): Promise<IResponse<IPaymentMethodList>> =>
  await baseApi(`${BASE}/billing/payment-methods/${paymentMethodId}`, {
    method: "DELETE",
    ...PAYMENT_OPTS,
  });

/**
 * The order-summary panel's only data source: subtotal, discount, tax and
 * total computed server-side in cents. Displayed as received — the client
 * never recomputes a total, or it would disagree with the invoice built from
 * the same ladder minutes later.
 *
 * A refused discount code comes back as a 400 whose `message` says why (code
 * scoped to another plan, expired, not active yet, unknown or switched off);
 * the checkout panel renders whatever message arrives inline under the code
 * field.
 */
export const getCheckoutQuote = async (payload: {
  plan_id: number;
  seats: number;
  cycle: BillingCycle;
  discount_code?: string;
}): Promise<IResponse<ICheckoutQuote>> =>
  await baseApi(`${BASE}/checkout/quote`, {
    method: "POST",
    body: payload,
    ...PAYMENT_OPTS,
    // POST only because it takes a body — it changes nothing, so there is
    // nothing to revalidate. Kept although nothing here is tagged: the
    // checkout page fetches this during its server render to paint the order
    // summary on the first frame, and `revalidateTag` during a render is a
    // hard error in Next 15 that once took the whole route down — a tag added
    // here later must not bring that back.
    skipRevalidate: true,
  });

/**
 * Creates (or reuses) the subscription behind the custom checkout.
 *
 * Server-side this is `payment_behavior: "default_incomplete"`, so a decline
 * leaves the subscription `incomplete` with the SAME PaymentIntent still
 * confirmable. The retry path calls `stripe.confirmPayment` again with the
 * returned secret — it must NOT call this action a second time, or a second
 * subscription could be minted.
 *
 * A company that already holds a live subscription is switched (prorated)
 * instead of double-charged; the server branches internally and flags it with
 * `switched`.
 */
export const subscribeToPlan = async (
  payload: ISubscribePayload,
): Promise<IResponse<ISubscribeResult>> =>
  await baseApi(`${BASE}/subscription/subscribe`, {
    method: "POST",
    body: payload,
    ...PAYMENT_OPTS,
  });

/**
 * Post-confirmation activation — the analogue of `confirmCheckout` for the
 * custom flow. Re-reads the subscription from Stripe and syncs it, so
 * activation never depends on webhook delivery. Idempotent; safe to retry.
 */
export const confirmSubscription = async (
  subscriptionId: string,
): Promise<IResponse<IConfirmSubscriptionResult>> =>
  await baseApi(`${BASE}/subscription/confirm`, {
    method: "POST",
    body: { subscription_id: subscriptionId },
    ...PAYMENT_OPTS,
  });

/**
 * In-app retry of a failed invoice — the alternative to Stripe's hosted page.
 * A payment surface (no 402 bounce) that is also a subscription write: paying
 * is what lifts a lockout, so it re-renders the route like the other writes.
 */
export const payInvoice = async (
  invoiceId: number,
  paymentMethodId?: string,
): Promise<IResponse<IInvoicePayResult>> =>
  await baseApi(`${BASE}/billing/invoices/${invoiceId}/pay`, {
    method: "POST",
    body: paymentMethodId ? { payment_method_id: paymentMethodId } : {},
    ...PAYMENT_OPTS,
    ...SUBSCRIPTION_WRITE,
  });
