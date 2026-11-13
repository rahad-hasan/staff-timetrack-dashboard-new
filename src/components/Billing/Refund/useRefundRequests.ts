"use client";

import { getRefundRequests } from "@/actions/billing/refundAction";
import type { IRefundRequest } from "@/types/billing";
import { usePagedBillingList } from "../usePagedBillingList";

interface RefundRequestsState {
  rows: IRefundRequest[];
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * The company's refund history, paged in local state like the invoice
 * history (see `usePagedBillingList`). `dataVersion` is the billing store's
 * "something changed" counter: a new request, a withdrawal or a console
 * decision (socket ping) bumps it and this list refetches once.
 */
export const useRefundRequests = (limit = 10): RefundRequestsState => {
  const { rows, page, setPage, totalPages, loading, error, retry } =
    usePagedBillingList<IRefundRequest>(getRefundRequests, {
      limit,
      failedMessage: "Failed to load refund requests.",
      thrownMessage: "Failed to load refund requests.",
    });

  return { rows, page, setPage, totalPages, loading, error, retry };
};
