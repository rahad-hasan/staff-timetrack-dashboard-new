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
import { actionErrorMessage } from "@/lib/actionErrors";
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
/** The events endpoint's largest page (backend validation). */
const MAX_POLL_LIMIT = 100;

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

  // Bumped by every page load. A newer load discards an older one's result,
  // and a poll that started before a load discards its own. Polls never bump
  // it: a poll used to, which threw away an in-flight load and left the
  // drawer stuck on its spinner.
  const requestIdRef = useRef(0);
  // The row object is replaced every time the page re-reads its summary, so
  // the drawer keys its loads on the user's id — not the object, which used
  // to reload the list (and drop "Load more" pages) on every summary poll.
  const userId = user?.user.id ?? null;

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
      if (userId === null) return;
      const reqId = ++requestIdRef.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const query: ISuspensionEventsQuery = {
        user_id: userId,
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
          // Pages are fixed-size, so what is loaded follows from the page
          // number — no stale read of `events` from this callback's closure.
          const total = res.meta?.total ?? 0;
          const loadedSoFar = (pageNum - 1) * PAGE_SIZE + res.data.length;
          setHasMore(loadedSoFar < total && res.data.length === PAGE_SIZE);
          setPage(pageNum);
        } else {
          setError(res?.message ?? "Unable to load events.");
        }
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        setError(actionErrorMessage(e, "Unable to load events."));
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [userId, timezone, stableFilters],
  );

  useEffect(() => {
    if (!open || userId === null) return;
    setEvents([]);
    setPage(1);
    setHasMore(false);
    fetchEvents(1, false);
  }, [open, userId, fetchEvents]);

  // Polling for ongoing events while drawer open — 30s, paused when tab hidden.
  // Keyed on these two values, not the list: a poll that only refreshes rows
  // leaves both unchanged and so does not restart the timer.
  const hasOngoing = events.some((e) => e.ongoing);
  const loadedCount = events.length;
  useEffect(() => {
    if (!open || userId === null || !hasOngoing) return;

    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const startedFor = requestIdRef.current;
      try {
        // The loaded window re-read WITHOUT any status filter. The API's
        // "ongoing" filter only returns events that are still open, so a poll
        // filtered by it never saw an event resume: the row stayed "ongoing"
        // forever and kept this timer running. Rows are replaced by id, so a
        // resumed event flips to ended in place.
        const res = await listSuspensionEvents({
          user_id: userId,
          page: 1,
          limit: Math.min(MAX_POLL_LIMIT, Math.max(PAGE_SIZE, loadedCount)),
          timezone,
          sort: "suspended_at",
          order: "desc",
          ...stableFilters,
          status: undefined,
        });
        if (cancelled || startedFor !== requestIdRef.current) return;
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
  }, [open, userId, hasOngoing, loadedCount, stableFilters, timezone]);

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
