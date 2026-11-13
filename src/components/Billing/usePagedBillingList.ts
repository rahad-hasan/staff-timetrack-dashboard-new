"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { unstable_rethrow } from "next/navigation";

import { useBillingStore } from "@/store/billingStore";
import type { IResponse } from "@/types/type";

export interface PagedBillingList<T> {
  rows: T[];
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  loading: boolean;
  /** The request is simply taking a while (only with `slowAfterMs`). */
  slow: boolean;
  error: string | null;
  retry: () => void;
}

interface PagedBillingListOptions {
  limit: number;
  /** Shown when the API answers with a failure envelope that has no message. */
  failedMessage: string;
  /** Shown when the call itself throws (dropped connection, deploy skew). */
  thrownMessage: string;
  /** Flip `slow` after this long without an answer; omit to never flip it. */
  slowAfterMs?: number;
}

/**
 * A billing list paged in local state — the invoice history, the refund
 * requests. Pagination is not the `?page=` URL param: these tables share
 * /settings/billing with other surfaces and must page independently.
 *
 * - **`dataVersion` is a dependency.** Every billing mutation bumps it (see
 *   `useBillingRefresh`), and the list lives in component state where no
 *   server render can reach it — without the bump, the charge the user just
 *   authorised is missing from the history until a reload.
 * - **`latestRequest` is a monotonic id, not a cancelled flag.** Retry (or a
 *   `dataVersion` bump landing mid-flight) can put two reads in the air at
 *   once, and the loser must not write its result over the winner's.
 *
 * `fetchPage` must be stable — pass the server action itself, not a closure.
 */
export function usePagedBillingList<T>(
  fetchPage: (query: {
    page: number;
    limit: number;
  }) => Promise<IResponse<T[]>>,
  { limit, failedMessage, thrownMessage, slowAfterMs }: PagedBillingListOptions,
): PagedBillingList<T> {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<T[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const dataVersion = useBillingStore((s) => s.dataVersion);
  const latestRequest = useRef(0);

  useEffect(() => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;

    setLoading(true);
    setError(null);
    setSlow(false);

    const slowTimer =
      slowAfterMs === undefined
        ? null
        : setTimeout(() => {
            if (latestRequest.current === requestId) setSlow(true);
          }, slowAfterMs);

    const load = async () => {
      try {
        const response = await fetchPage({ page, limit });
        if (latestRequest.current !== requestId) return;
        if (response?.success) {
          setRows(Array.isArray(response.data) ? response.data : []);
          setTotalPages(Math.max(1, response.meta?.totalPages ?? 1));
        } else {
          setError(response?.message || failedMessage);
        }
      } catch (error) {
        unstable_rethrow(error);
        if (latestRequest.current === requestId) setError(thrownMessage);
      } finally {
        if (slowTimer) clearTimeout(slowTimer);
        if (latestRequest.current === requestId) {
          setLoading(false);
          setSlow(false);
        }
      }
    };

    void load();

    return () => {
      if (slowTimer) clearTimeout(slowTimer);
    };
  }, [
    fetchPage,
    page,
    limit,
    reloadToken,
    dataVersion,
    failedMessage,
    thrownMessage,
    slowAfterMs,
  ]);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  return { rows, page, setPage, totalPages, loading, slow, error, retry };
}
