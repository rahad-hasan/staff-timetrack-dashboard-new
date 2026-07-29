"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Clock,
  Loader2,
  ShieldAlert,
  Zap,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { listSuspensionEvents } from "@/actions/suspensions/action";
import type {
  ISuspensionEvent,
  ISuspensionEventsQuery,
  ISuspensionSummaryRow,
  TSeverity,
  TSuspensionStatusFilter,
} from "@/types/trackingSuspension";
import { EventListItem } from "./EventListItem";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

interface Props {
  open: boolean;
  user: ISuspensionSummaryRow | null;
  timezone: string;
  filters: {
    from_date?: string;
    to_date?: string;
    project_id?: string;
    reason?: string;
    severity?: TSeverity | "all";
    status?: TSuspensionStatusFilter | "all";
  };
  expandedEventId: number | null;
  onExpandEvent: (id: number | null) => void;
  onClose: () => void;
}

function MiniStat({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-borderColor bg-bgPrimary p-2 dark:border-darkBorder dark:bg-darkPrimaryBg",
        className,
      )}
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-[10px] font-medium uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
          {label}
        </div>
        <div className="text-sm font-semibold tabular-nums text-headingTextColor dark:text-darkTextPrimary">
          {value}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDrawer({
  open,
  user,
  timezone,
  filters,
  expandedEventId,
  onExpandEvent,
  onClose,
}: Props) {
  const [events, setEvents] = useState<ISuspensionEvent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const stableFilters = useMemo(
    () => ({
      from_date: filters.from_date,
      to_date: filters.to_date,
      project_id: filters.project_id,
      reason: filters.reason,
      severity: filters.severity && filters.severity !== "all" ? filters.severity : undefined,
      status: filters.status && filters.status !== "all" ? filters.status : undefined,
    }),
    [
      filters.from_date,
      filters.to_date,
      filters.project_id,
      filters.reason,
      filters.severity,
      filters.status,
    ],
  );

  const fetchEvents = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!user) return;
      const reqId = ++requestIdRef.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const query: ISuspensionEventsQuery = {
        user_id: user.user.id,
        page: pageNum,
        limit: PAGE_SIZE,
        timezone,
        sort: "suspended_at",
        order: "desc",
        ...stableFilters,
      };

      try {
        const res = await listSuspensionEvents(query);
        if (reqId !== requestIdRef.current) return;

        if (res?.success && Array.isArray(res.data)) {
          setEvents((prev) => (append ? [...prev, ...res.data] : res.data));
          const total = res.meta?.total ?? 0;
          const loadedSoFar = (append ? events.length : 0) + res.data.length;
          setHasMore(loadedSoFar < total && res.data.length === PAGE_SIZE);
          setPage(pageNum);
        } else {
          setError(res?.message ?? "Unable to load events.");
        }
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        setError((e as Error)?.message || "Unable to load events.");
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    // events.length intentionally not a dep — fetchEvents reads latest via closure on (append, page) call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, timezone, stableFilters],
  );

  useEffect(() => {
    if (!open || !user) return;
    setEvents([]);
    setPage(1);
    setHasMore(false);
    fetchEvents(1, false);
  }, [open, user, fetchEvents]);

  // Polling for ongoing events while drawer open — 30s, paused when tab hidden.
  useEffect(() => {
    if (!open || !user) return;
    const hasOngoing = (user.ongoing_count ?? 0) > 0 || events.some((e) => e.ongoing);
    if (!hasOngoing) return;

    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const reqId = ++requestIdRef.current;
      try {
        const res = await listSuspensionEvents({
          user_id: user.user.id,
          page: 1,
          limit: Math.max(PAGE_SIZE, events.length || PAGE_SIZE),
          timezone,
          sort: "suspended_at",
          order: "desc",
          ...stableFilters,
          status: "ongoing",
        });
        if (cancelled || reqId !== requestIdRef.current) return;
        if (res?.success && Array.isArray(res.data)) {
          const liveById = new Map(res.data.map((e) => [e.id, e]));
          setEvents((prev) => prev.map((e) => liveById.get(e.id) ?? e));
        }
      } catch {
        // swallow — polling errors should not surface
      }
    };

    const id = window.setInterval(tick, 30_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [open, user, events, stableFilters, timezone]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchEvents(page + 1, true);
  }, [loading, loadingMore, hasMore, page, fetchEvents]);

  const handleToggleExpand = useCallback(
    (id: number) => {
      onExpandEvent(expandedEventId === id ? null : id);
    },
    [expandedEventId, onExpandEvent],
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full bg-bgPrimary p-0 sm:max-w-[640px] dark:bg-darkPrimaryBg"
        aria-labelledby="employee-drawer-title"
        aria-describedby="employee-drawer-desc"
      >
        {user && (
          <>
            <SheetHeader className="border-b border-borderColor p-5 dark:border-darkBorder">
              <div className="flex items-center gap-3 pr-8">
                <div className="relative size-12 overflow-hidden rounded-full border border-borderColor bg-bgSecondary dark:border-darkBorder dark:bg-darkSecondaryBg">
                  {user.user.image ? (
                    <Image
                      src={user.user.image}
                      alt={`${user.user.name} avatar`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-base font-semibold uppercase text-subTextColor dark:text-darkTextSecondary">
                      {user.user.name?.[0] ?? "?"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle id="employee-drawer-title" className="truncate text-lg">
                    {user.user.name}
                  </SheetTitle>
                  <SheetDescription
                    id="employee-drawer-desc"
                    className="truncate text-xs text-subTextColor dark:text-darkTextSecondary"
                  >
                    {user.user.email}
                  </SheetDescription>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MiniStat
                  icon={<AlertTriangle className="size-3.5" />}
                  label="Events"
                  value={user.event_count}
                />
                <MiniStat
                  icon={<Zap className="size-3.5" />}
                  label="Ongoing"
                  value={user.ongoing_count}
                />
                <MiniStat
                  icon={<ShieldAlert className="size-3.5" />}
                  label="High sev"
                  value={user.high_severity_count}
                />
                <MiniStat
                  icon={<Clock className="size-3.5" />}
                  label="Paused"
                  value={user.total_duration}
                />
              </div>
            </SheetHeader>

            <div
              className="flex-1 overflow-y-auto px-5 py-4"
              role="region"
              aria-label="Suspension events for this employee"
            >
              {loading && events.length === 0 ? (
                <div className="space-y-2" role="status" aria-live="polite">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-bgSecondary dark:bg-darkSecondaryBg">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
                  </div>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 animate-pulse rounded-md bg-bgSecondary dark:bg-darkSecondaryBg"
                    />
                  ))}
                </div>
              ) : error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  {error}
                </p>
              ) : events.length === 0 ? (
                <p className="rounded-md border border-dashed border-borderColor px-3 py-8 text-center text-sm text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
                  No events match the current filters.
                </p>
              ) : (
                <ul className="space-y-2">
                  {events.map((event) => (
                    <EventListItem
                      key={event.id}
                      event={event}
                      expanded={expandedEventId === event.id}
                      onToggle={handleToggleExpand}
                      timezone={timezone}
                    />
                  ))}
                </ul>
              )}

              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline2"
                    size="default"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" /> Loading
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
