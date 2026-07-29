"use client";

import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectDateRange from "@/components/Common/SelectDateRange";
import AppPagination from "@/components/Common/AppPagination";
import {
  listSuspensionReasons,
  listSuspensionSummary,
} from "@/actions/suspensions/action";
import type {
  IMeta,
  ISuspensionReasonOption,
  ISuspensionSummary,
  ISuspensionSummaryQuery,
  ISuspensionSummaryRow,
  TSeverity,
  TSuspensionStatusFilter,
} from "@/types/trackingSuspension";
import { KpiStrip } from "./KpiStrip";
import { SuspensionsFilters } from "./SuspensionsFilters";
import { SuspensionsTable } from "./SuspensionsTable";
import { SuspensionsErrorBoundary } from "./SuspensionsErrorBoundary";

const EmployeeDrawer = lazy(() => import("./EmployeeDrawer"));

const DEFAULT_LIMIT = 20;
const DEFAULT_SORT = "last_suspended_at";
const DEFAULT_ORDER: "asc" | "desc" = "desc";

// Module-level cache for /reasons — staleTime: Infinity (per spec §4.5).
let reasonsCache: ISuspensionReasonOption[] | null = null;

function getBrowserTimezone() {
  if (typeof window === "undefined") return "UTC";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function formatDateToISO(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getCurrentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from, to: now };
}

interface UrlState {
  page: number;
  limit: number;
  search: string;
  project_id: string;
  from_date: string;
  to_date: string;
  reason: string;
  severity: TSeverity | "all";
  status: TSuspensionStatusFilter | "all";
  sort: string;
  order: "asc" | "desc";
  timezone: string;
  selected_user: number | null;
  expanded_event: number | null;
}

function readUrlState(
  params: URLSearchParams,
  defaultTz: string,
  defaultFrom: string,
  defaultTo: string,
): UrlState {
  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(params.get("limit")) || DEFAULT_LIMIT),
  );
  const sevRaw = params.get("severity");
  const statusRaw = params.get("status");
  const selectedRaw = params.get("selected_user");
  const expandedRaw = params.get("expanded_event");
  return {
    page,
    limit,
    search: params.get("search")?.slice(0, 120) ?? "",
    project_id: params.get("project_id") ?? "",
    from_date: params.get("from_date") ?? defaultFrom,
    to_date: params.get("to_date") ?? defaultTo,
    reason: params.get("reason") ?? "",
    severity: (sevRaw as TSeverity) || "all",
    status: (statusRaw as TSuspensionStatusFilter) || "all",
    sort: params.get("sort") ?? DEFAULT_SORT,
    order: (params.get("order") === "asc" ? "asc" : DEFAULT_ORDER),
    timezone: params.get("timezone") ?? defaultTz,
    selected_user: selectedRaw ? Number(selectedRaw) || null : null,
    expanded_event: expandedRaw ? Number(expandedRaw) || null : null,
  };
}

export default function SuspensionsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultTz = useMemo(() => getBrowserTimezone(), []);
  const defaultRange = useMemo(() => getCurrentMonthRange(), []);
  const defaultFromIso = useMemo(
    () => formatDateToISO(defaultRange.from),
    [defaultRange.from],
  );
  const defaultToIso = useMemo(
    () => formatDateToISO(defaultRange.to),
    [defaultRange.to],
  );
  const state = useMemo(
    () =>
      readUrlState(
        new URLSearchParams(searchParams.toString()),
        defaultTz,
        defaultFromIso,
        defaultToIso,
      ),
    [searchParams, defaultTz, defaultFromIso, defaultToIso],
  );

  const [summary, setSummary] = useState<ISuspensionSummary | null>(null);
  const [meta, setMeta] = useState<IMeta | null>(null);
  const [reasons, setReasons] = useState<ISuspensionReasonOption[]>(reasonsCache ?? []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summaryRequestId = useRef(0);
  const lastViewButtonRef = useRef<HTMLElement | null>(null);

  const writeParams = useCallback(
    (patch: Partial<Record<string, string | number | null>>, opts?: { resetPage?: boolean }) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === undefined || v === "" || v === "all") next.delete(k);
        else next.set(k, String(v));
      });
      if (opts?.resetPage && !("page" in patch)) next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Seed default date range into URL on first mount when not present,
  // so the picker label and shareable URL reflect the active filter.
  useEffect(() => {
    const current = new URLSearchParams(searchParams.toString());
    if (current.get("from_date") || current.get("to_date")) return;
    current.set("from_date", defaultFromIso);
    current.set("to_date", defaultToIso);
    router.replace(`${pathname}?${current.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch reasons once (cached for the session).
  useEffect(() => {
    if (reasonsCache) return;
    let cancelled = false;
    listSuspensionReasons()
      .then((res) => {
        if (cancelled) return;
        if (res?.success && Array.isArray(res.data)) {
          reasonsCache = res.data;
          setReasons(res.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch summary whenever URL state changes (params that drive the request).
  const summaryParams: ISuspensionSummaryQuery = useMemo(
    () => ({
      page: state.page,
      limit: state.limit,
      search: state.search || undefined,
      project_id: state.project_id || undefined,
      from_date: state.from_date || undefined,
      to_date: state.to_date || undefined,
      reason: state.reason || undefined,
      sort: state.sort as ISuspensionSummaryQuery["sort"],
      order: state.order,
      timezone: state.timezone,
    }),
    [
      state.page,
      state.limit,
      state.search,
      state.project_id,
      state.from_date,
      state.to_date,
      state.reason,
      state.sort,
      state.order,
      state.timezone,
    ],
  );

  const fetchSummary = useCallback(
    async (silent = false) => {
      const reqId = ++summaryRequestId.current;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await listSuspensionSummary(summaryParams);
        if (reqId !== summaryRequestId.current) return;
        if (res?.success && res.data) {
          setSummary(res.data);
          setMeta(res.meta ?? null);
        } else {
          setError(res?.message ?? "Unable to load summary.");
        }
      } catch (e) {
        if (reqId !== summaryRequestId.current) return;
        setError((e as Error)?.message || "Unable to load summary.");
      } finally {
        if (reqId === summaryRequestId.current && !silent) setLoading(false);
      }
    },
    [summaryParams],
  );

  useEffect(() => {
    fetchSummary(false);
  }, [fetchSummary]);

  // Polling for ongoing rows — 60s, paused when tab is hidden.
  useEffect(() => {
    const hasOngoing = (summary?.totals?.total_ongoing ?? 0) > 0;
    if (!hasOngoing) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      fetchSummary(true);
    };
    const id = window.setInterval(tick, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [summary?.totals?.total_ongoing, fetchSummary]);

  const handleSort = useCallback(
    (field: string) => {
      const sameField = state.sort === field;
      const nextOrder = sameField && state.order === "desc" ? "asc" : "desc";
      writeParams({ sort: field, order: nextOrder }, { resetPage: true });
    },
    [state.sort, state.order, writeParams],
  );

  const handleFiltersChange = useCallback(
    (next: {
      search?: string;
      reason?: string;
      severity?: TSeverity | "all";
      status?: TSuspensionStatusFilter | "all";
      sort?: string;
      order?: "asc" | "desc";
    }) => {
      writeParams(
        {
          search: next.search,
          reason: next.reason,
          severity: next.severity,
          status: next.status,
          sort: next.sort,
          order: next.order,
        },
        { resetPage: true },
      );
    },
    [writeParams],
  );

  const handleReset = useCallback(() => {
    const next = new URLSearchParams();
    next.set("from_date", defaultFromIso);
    next.set("to_date", defaultToIso);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [pathname, router, defaultFromIso, defaultToIso]);

  const handleView = useCallback(
    (userId: number) => {
      if (typeof document !== "undefined") {
        lastViewButtonRef.current = document.querySelector<HTMLElement>(
          `[data-user-view-id="${userId}"]`,
        );
      }
      writeParams({ selected_user: userId, expanded_event: null });
    },
    [writeParams],
  );

  const handleCloseDrawer = useCallback(() => {
    writeParams({ selected_user: null, expanded_event: null });
    const btn = lastViewButtonRef.current;
    if (btn) {
      requestAnimationFrame(() => btn.focus());
    }
  }, [writeParams]);

  const handleExpandEvent = useCallback(
    (id: number | null) => writeParams({ expanded_event: id }),
    [writeParams],
  );

  const selectedRow: ISuspensionSummaryRow | null = useMemo(() => {
    if (!state.selected_user || !summary) return null;
    return (
      summary.rows.find((r) => r.user.id === state.selected_user) ?? null
    );
  }, [state.selected_user, summary]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <HeadingComponent
          heading="Suspicious Activity"
          subHeading="Tracking suspensions flagged by anomaly detection."
        />
        <div className="flex items-center gap-3">
          <Suspense fallback={null}>
            <SelectDateRange
              defaultDateShow={false}
              defaultRange={defaultRange}
            />
          </Suspense>
        </div>
      </div>

      <KpiStrip totals={summary?.totals ?? null} loading={loading && !summary} />

      <div className="rounded-[12px] border border-borderColor bg-bgPrimary p-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
        <SuspensionsFilters
          search={state.search}
          reason={state.reason}
          severity={state.severity}
          status={state.status}
          sort={state.sort}
          order={state.order}
          reasons={reasons}
          onChange={handleFiltersChange}
          onReset={handleReset}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <SuspensionsErrorBoundary fallbackTitle="Couldn't render the summary table.">
        <SuspensionsTable
          rows={summary?.rows ?? []}
          loading={loading}
          sort={state.sort}
          order={state.order}
          onSort={handleSort}
          onView={handleView}
          selectedUserId={state.selected_user}
        />

        {meta && meta.total > 0 && (
          <AppPagination
            total={meta.total}
            currentPage={meta.page}
            limit={meta.limit}
          />
        )}
      </SuspensionsErrorBoundary>

      <SuspensionsErrorBoundary fallbackTitle="Couldn't render the event drawer.">
        <Suspense fallback={null}>
          <EmployeeDrawer
            open={Boolean(selectedRow)}
            user={selectedRow}
            timezone={state.timezone}
            filters={{
              from_date: state.from_date || undefined,
              to_date: state.to_date || undefined,
              project_id: state.project_id || undefined,
              reason: state.reason || undefined,
              severity: state.severity,
              status: state.status,
            }}
            expandedEventId={state.expanded_event}
            onExpandEvent={handleExpandEvent}
            onClose={handleCloseDrawer}
          />
        </Suspense>
      </SuspensionsErrorBoundary>
    </div>
  );
}
