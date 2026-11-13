"use server";

import { baseApi } from "../baseApi";
import { IResponse } from "@/types/type";
import {
  ICreateRefundPayload,
  IRefundEligibility,
  IRefundRequest,
  IRefundRequestDetail,
  TRefundStatus,
} from "@/types/billing";

/**
 * Refund requests. Like the other billing actions these never throw: a
 * failure comes back as `{ success: false, message }` and the dialogs show
 * `message` inline.
 *
 * Untagged on purpose (see "Freshness" in ./action.ts). A request only asks
 * the billing team for money back — nothing about the subscription changes
 * until they process it, and that decision arrives over the `refunds:changed`
 * socket ping. The lists live in client state and re-read on the billing
 * store's `dataVersion`, so a whole-route re-render per request would refresh
 * nothing anyone is looking at.
 */
const BASE = "/refunds";

export const getRefundEligibility = async (
  invoiceId: number,
): Promise<IResponse<IRefundEligibility>> =>
  await baseApi(`${BASE}/invoices/${invoiceId}/eligibility`);

export const getRefundRequests = async (
  query: { page?: number; limit?: number; status?: TRefundStatus } = {},
): Promise<IResponse<IRefundRequest[]>> => await baseApi(BASE, { query });

export const createRefundRequest = async (
  payload: ICreateRefundPayload,
): Promise<IResponse<IRefundRequestDetail>> =>
  await baseApi(BASE, {
    method: "POST",
    body: payload,
  });

export const cancelRefundRequest = async (
  id: number,
): Promise<IResponse<IRefundRequestDetail>> =>
  await baseApi(`${BASE}/${id}/cancel`, {
    method: "POST",
    body: {},
  });
