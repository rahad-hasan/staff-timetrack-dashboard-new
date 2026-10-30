"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRefundRequests } from "@/actions/billing/refundAction";
import { useBillingStore } from "@/store/billingStore";
import type { IRefundRequest } from "@/types/billing";

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
 * The company's refund history, paged in local state like useInvoiceHistory.
 * `dataVersion` is the billing store's "something changed" counter: a new
 * request, a withdrawal or a console decision (socket ping) bumps it and this
 * list refetches once. A request counter drops responses that arrive after a
 * newer one was started.
 */
export const useRefundRequests = (limit = 10): RefundRequestsState => {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<IRefundRequest[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const dataVersion = useBillingStore((s) => s.dataVersion);
  const latestRequest = useRef(0);

  useEffect(() => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getRefundRequests({ page, limit });
        if (latestRequest.current !== requestId) return;

        if (response?.success) {
          setRows(Array.isArray(response.data) ? response.data : []);
          setTotalPages(Math.max(1, response.meta?.totalPages ?? 1));
        } else {
          setError(response?.message || "Failed to load refund requests.");
        }
      } catch {
        if (latestRequest.current === requestId) {
          setError("Failed to load refund requests.");
        }
      } finally {
        if (latestRequest.current === requestId) setLoading(false);
      }
    };

    void load();
  }, [page, limit, reloadToken, dataVersion]);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  return { rows, page, setPage, totalPages, loading, error, retry };
};
