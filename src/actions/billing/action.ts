"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IResponse } from "@/types/type";
import {
  IAddSeatsResult,
  IBillingInvoice,
  IBillingPlan,
  IBillingStatus,
  ICancelPayload,
  ICheckoutPayload,
  ICheckoutSession,
  IDiscountCode,
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
 * The status endpoint is the billing state machine: refetch it after EVERY
 * billing action — never cache it.
 */
const BASE = "/packages";
const TAG = "billing";

export const getBillingStatus = async (): Promise<IResponse<IBillingStatus>> =>
  await baseApi(`${BASE}/billing/status`, {
    tag: TAG,
    cache: "no-cache",
  });

/** Public pricing list — active plans with display pricing (dollars). */
export const getPlans = async (): Promise<IResponse<IBillingPlan[]>> =>
  await baseApi(`${BASE}`, {
    tag: TAG,
    cache: "no-cache",
  });

export const getDiscountList = async (
  planId: number,
): Promise<IResponse<IDiscountCode[]>> =>
  await baseApi(`${BASE}/discount/list?plan=${planId}`, {
    tag: TAG,
    cache: "no-cache",
  });

/**
 * First purchase — returns a Stripe-hosted checkout URL to redirect to.
 * Stripe returns the browser to /billing/success?session_id=… or /billing/cancel.
 * 400s to surface inline: seats below active users, subscription already exists
 * (route to switch-plan / add-seats instead).
 */
export const createCheckoutSession = async (
  payload: ICheckoutPayload,
): Promise<IResponse<ICheckoutSession>> =>
  await baseApi(`${BASE}/payment/url`, {
    method: "POST",
    body: payload,
    tag: TAG,
    cache: "no-cache",
  });

/** Step 1 of add-seats — read-only proration preview, no charge. ALWAYS quote first. */
export const getSeatQuote = async (
  seats: number,
): Promise<IResponse<ISeatQuote>> =>
  await baseApi(`${BASE}/subscription/seat-quote`, {
    method: "POST",
    body: { seats },
    tag: TAG,
    cache: "no-cache",
  });

/** Step 2 of add-seats — confirm. Three outcomes: paid / pending payment / 400 blocked. */
export const addSeats = async (
  seats: number,
): Promise<IResponse<IAddSeatsResult>> =>
  await baseApi(`${BASE}/subscription/add-seats`, {
    method: "PATCH",
    body: { seats },
    tag: TAG,
    cache: "no-cache",
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
    tag: TAG,
    cache: "no-cache",
  });

export const getBillingInvoices = async (
  query: { page?: number; limit?: number } = {},
): Promise<IResponse<IBillingInvoice[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `${BASE}/billing/invoices${queryString ? `?${queryString}` : ""}`,
    {
      tag: TAG,
      cache: "no-cache",
    },
  );
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
    tag: TAG,
    cache: "no-cache",
  });

/** Over-limit trial expiry — what the owner must choose between. */
export const getDowngradePreview = async (): Promise<
  IResponse<IDowngradePreview>
> =>
  await baseApi(`${BASE}/downgrade/preview`, {
    tag: TAG,
    cache: "no-cache",
  });

export const resolveDowngrade = async (
  payload: IDowngradeResolvePayload,
): Promise<IResponse<IDowngradeResolveResult>> =>
  await baseApi(`${BASE}/downgrade/resolve`, {
    method: "POST",
    body: payload,
    tag: TAG,
    cache: "no-cache",
  });

/** After a later upgrade — restores oldest-parked first, up to the new caps. */
export const restoreParked = async (): Promise<IResponse<IRestoreResult>> =>
  await baseApi(`${BASE}/downgrade/restore`, {
    method: "POST",
    body: {},
    tag: TAG,
    cache: "no-cache",
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
    tag: TAG,
    cache: "no-cache",
  });
