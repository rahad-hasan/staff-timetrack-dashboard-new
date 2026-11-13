"use client";

import { getBillingInvoices } from "@/actions/billing/action";
import { IBillingInvoice } from "@/types/billing";
import { usePagedBillingList } from "../usePagedBillingList";

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
 * Paged invoice history — the shared billing list machinery (see
 * `usePagedBillingList`: local-state pagination, `dataVersion` reloads, stale
 * responses dropped) plus the slow-load reassurance.
 */
export const useInvoiceHistory = (limit = 10): InvoiceHistoryState => {
  const { rows, page, setPage, totalPages, loading, slow, error, retry } =
    usePagedBillingList<IBillingInvoice>(getBillingInvoices, {
      limit,
      failedMessage: "Failed to load invoices.",
      thrownMessage: "Something went wrong while loading invoices.",
      slowAfterMs: SLOW_LOAD_MS,
    });

  return {
    page,
    setPage,
    invoices: rows,
    totalPages,
    loading,
    slow,
    error,
    retry,
  };
};
