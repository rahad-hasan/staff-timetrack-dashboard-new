"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getBillingInvoices } from "@/actions/billing/action";
import { useBillingStore } from "@/store/billingStore";
import { IBillingInvoice } from "@/types/billing";

/**
 * After this long without a response we tell the user why. Page 1 can trigger a
 * one-off Stripe reconciliation (the "No invoices yet" self-heal), which takes a
 * couple of seconds — the guide is explicit that there must be NO client-side
 * timeout on it, so this only changes the copy, never the request.
 */
const SLOW_LOAD_MS = 2500;

export interface InvoiceHistoryState {
  page: number;
  setPage: (page: number) => void;
  invoices: IBillingInvoice[];
  totalPages: number;
  loading: boolean;
  /** The request is simply taking a while — show reassurance, don't give up. */
  slow: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Paged invoice history. Pagination is local state, not the `?page=` URL param:
 * the table lives on `/settings/billing` alongside other paged surfaces and must
 * page independently of them.
 */
export const useInvoiceHistory = (limit = 10): InvoiceHistoryState => {
  const [page, setPage] = useState(1);
  const [invoices, setInvoices] = useState<IBillingInvoice[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  /**
   * Every billing mutation bumps this. Adding seats or switching plans creates
   * an invoice, and this table owns its data in component state — no server
   * revalidation can reach it, so without this the charge the user just
   * authorised is missing from the history until they reload the page.
   */
  const dataVersion = useBillingStore((s) => s.dataVersion);

  /**
   * Monotonic request id. A "cancelled" boolean is not enough here: Retry can
   * fire a second request while the first is still in flight, and the loser must
   * not be allowed to write its result over the winner's.
   */
  const latestRequest = useRef(0);

  useEffect(() => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;

    setLoading(true);
    setError(null);
    setSlow(false);

    const slowTimer = setTimeout(() => {
      if (latestRequest.current === requestId) setSlow(true);
    }, SLOW_LOAD_MS);

    const load = async () => {
      try {
        const response = await getBillingInvoices({ page, limit });
        if (latestRequest.current !== requestId) return;
        if (response?.success) {
          setInvoices(Array.isArray(response.data) ? response.data : []);
          setTotalPages(Math.max(1, response.meta?.totalPages ?? 1));
        } else {
          setError(response?.message || "Failed to load invoices.");
        }
      } catch {
        if (latestRequest.current === requestId) {
          setError("Something went wrong while loading invoices.");
        }
      } finally {
        clearTimeout(slowTimer);
        if (latestRequest.current === requestId) {
          setLoading(false);
          setSlow(false);
        }
      }
    };

    void load();

    return () => clearTimeout(slowTimer);
  }, [page, limit, reloadToken, dataVersion]);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  return { page, setPage, invoices, totalPages, loading, slow, error, retry };
};
