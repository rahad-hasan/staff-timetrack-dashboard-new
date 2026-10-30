"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IResponse } from "@/types/type";
import {
  ICreateRefundPayload,
  IRefundEligibility,
  IRefundRequest,
  IRefundRequestDetail,
  TRefundStatus,
} from "@/types/billing";

// Refund requests are billing data: share the billing tag so a request
// revalidates the cached billing reads along with it.
const BASE = "/refunds";
const TAG = "billing";

/**
 * Like the other billing actions these never throw: a failure comes back as
 * `{ success: false, message }` and the dialogs show `message` inline.
 */

export const getRefundEligibility = async (
  invoiceId: number,
): Promise<IResponse<IRefundEligibility>> =>
  await baseApi(`${BASE}/invoices/${invoiceId}/eligibility`, {
    tag: TAG,
    cache: "no-cache",
  });

export const getRefundRequests = async (
  query: { page?: number; limit?: number; status?: TRefundStatus } = {},
): Promise<IResponse<IRefundRequest[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(`${BASE}${queryString ? `?${queryString}` : ""}`, {
    tag: TAG,
    cache: "no-cache",
  });
};

export const createRefundRequest = async (
  payload: ICreateRefundPayload,
): Promise<IResponse<IRefundRequestDetail>> =>
  await baseApi(BASE, {
    method: "POST",
    body: payload,
    tag: TAG,
    cache: "no-cache",
  });

export const cancelRefundRequest = async (
  id: number,
): Promise<IResponse<IRefundRequestDetail>> =>
  await baseApi(`${BASE}/${id}/cancel`, {
    method: "POST",
    body: {},
    tag: TAG,
    cache: "no-cache",
  });
