"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketCounts } from "@/types/support";
import {
  FOCUS_RING_ON_BLUE,
  LiveIndicator,
  STATUS_ORDER,
  STATUS_TOKENS,
  StatsCardSkeleton,
  StatusDot,
  useLiveStatus,
} from "@/components/Support/primitives";

interface StatsCardProps {
  counts: TicketCounts | null;
  /** counts are being (re)read (Retry / Refresh): with none yet, the Retry chip shows it is busy */
  loading?: boolean;
  /** the route loading shell: draw the skeleton instead of the card */
  skeleton?: boolean;
  /** the socket is connected — drives the Live pill (REQ-U-17) */
  live: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * "Live" while the support socket is connected; "Offline" (grey dot) once it has been down for
 * more than the grace period, so the pill never claims live updates that are not arriving.
 */
const LivePill = ({ live }: { live: boolean }) => {
  const status = useLiveStatus(live);
  return (
    <LiveIndicator
      tone="glass"
      status={status}
      liveTitle="Counts update automatically"
      offlineTitle="Live updates paused — reconnecting…"
    />
  );
};

/**
 * 5-segment distribution bar: 8px segments with a 1px white ring, 4px gaps,
 * widths proportional to the counts (flex-grow = count, measured 1:2:1:2:1 →
 * 54/108/54/108/54 on a 394px track). Zero tickets = one empty ringed track
 * (white/20). Decorative: the legend carries the numbers.
 */
const DistributionBar = ({ counts }: { counts: TicketCounts | null }) => {
  const segments = counts
    ? STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => ({ status, count: counts[status] }))
    : [];
  return (
    <div aria-hidden="true" className="mt-[15.5px] flex h-2 w-full gap-1">
      {segments.length === 0 ? (
        <span className="h-2 w-full rounded-full bg-white/20 shadow-[0_0_0_1px_#ffffff]" />
      ) : (
        segments.map(({ status, count }) => (
          <span
            key={status}
            className="h-2 min-w-[6px] rounded-full shadow-[0_0_0_1px_#ffffff] transition-[flex-grow] duration-500 motion-reduce:transition-none"
            style={{ flexGrow: count, flexBasis: 0, backgroundColor: STATUS_TOKENS[status].dot }}
          />
        ))
      )}
    </div>
  );
};

/** Column 1: Open, In progress, Waiting on you — column 2: Resolved, Closed (as drawn). */
const LEGEND_COLUMNS = [STATUS_ORDER.slice(0, 3), STATUS_ORDER.slice(3)];

/**
 * The hero's glass stats card (REQ-U-02): "All statuses", the total, the Live
 * pill, the distribution bar and the two-column legend. Counts are the
 * requester's GLOBAL counts (`GET /tickets/counts`) — never affected by the
 * list's search, filters or page. Measured at 1440: 440×208, radius 14,
 * white/25 border, 22px side padding; the fill is the AA deep-blue glass
 * (`bg-support-stats-glass`, drawn white/10 — tokens.ts has the numbers and the revert).
 *
 * Counts failed → "—" and a Retry chip. Retry keeps focus while it reads (busy
 * chip, `aria-disabled`); when the counts land the chip becomes the Live pill,
 * so focus moves to the card itself (`tabIndex -1`) instead of <body>.
 */
export const StatsCard = ({ counts, loading = false, skeleton = false, live, onRetry, className }: StatsCardProps) => {
  const groupRef = useRef<HTMLDivElement>(null);
  const retryPressedRef = useRef(false);

  useEffect(() => {
    if (!counts || !retryPressedRef.current) return;
    retryPressedRef.current = false;
    const active = document.activeElement;
    if (!active || active === document.body) groupRef.current?.focus();
  }, [counts]);
  // A Retry that failed leaves the chip (and focus on it): forget the press.
  useEffect(() => {
    if (!loading && !counts) retryPressedRef.current = false;
  }, [loading, counts]);

  if (!counts && skeleton) {
    // same box as the card below, incl. its single-column height under 320 px (no shift on load)
    return <StatsCardSkeleton className={cn("max-w-none @max-[320px]/list:h-[258px]", className)} />;
  }
  const total = counts?.total;
  const retrying = !counts && loading;
  return (
    <div
      ref={groupRef}
      role="group"
      aria-label="Ticket status summary"
      aria-busy={retrying || undefined}
      tabIndex={-1}
      data-support-stats
      className={cn(
        "relative flex h-[208px] w-full shrink-0 flex-col rounded-[14px] border border-white/25 bg-support-stats-glass px-[22px] pt-5 text-white outline-none @max-[640px]/list:px-[18px] @max-[320px]/list:h-[258px]",
        FOCUS_RING_ON_BLUE,
        className,
      )}
    >
      <p className="text-[12px] leading-[18px] text-white/80">All statuses</p>
      <div className="flex h-10 items-end justify-between gap-3">
        <p className="flex min-w-0 items-baseline gap-[8.5px]" aria-live="off">
          <span className="text-[34px] font-medium leading-10 tabular-nums" data-support-total>
            {total ?? "—"}
          </span>
          <span className="relative bottom-[3px] text-[14px] leading-5 text-white/80">
            {total === 1 ? "ticket" : "tickets"}
          </span>
        </p>
        {counts ? (
          <LivePill live={live} />
        ) : (
          <button
            type="button"
            onClick={() => {
              if (retrying) return;
              retryPressedRef.current = true;
              onRetry?.();
            }}
            aria-disabled={retrying || undefined}
            aria-busy={retrying || undefined}
            aria-label={retrying ? "Retrying the ticket counts" : "Retry loading the ticket counts"}
            className={cn(
              "mb-[1px] inline-flex h-[22px] items-center gap-1.5 rounded-full bg-white/[0.12] px-[10px] text-[12px] font-medium leading-none text-white outline-none hover:bg-white/20 aria-disabled:cursor-progress",
              FOCUS_RING_ON_BLUE,
            )}
          >
            {retrying ? <Loader2 aria-hidden="true" className="size-3 motion-safe:animate-spin" /> : null}
            Retry
          </button>
        )}
      </div>
      <DistributionBar counts={counts} />
      {/* Phones (list < 640 px, not drawn): two equal columns cut "Waiting on you" to "Waiting on y…"
          at 390, so each column takes its content width (the long labels all sit in column 1) and
          the spare room goes between them — fits down to a 344 px viewport with the same 3 rows and
          208 px card. Narrower (list < 320 px, e.g. a 320 px phone): one column of 5 rows and a
          258 px card (+50 = two rows of 20 + 5), mirrored by the skeleton above — no text is cut
          at 320 CSS px (WCAG 1.4.10). */}
      <div className="mt-[15px] grid grid-cols-2 gap-x-[28.5px] @max-[640px]/list:grid-cols-[minmax(0,auto)_minmax(0,auto)] @max-[640px]/list:justify-between @max-[640px]/list:gap-x-4 @max-[320px]/list:grid-cols-1 @max-[320px]/list:gap-y-[5px]">
        {LEGEND_COLUMNS.map((column, index) => (
          <dl key={index} className="flex min-w-0 flex-col gap-[5px]">
            {column.map((status) => (
              <div key={status} className="flex h-5 min-w-0 items-center gap-2">
                <span aria-hidden="true" className="flex size-[9px] shrink-0 items-center justify-center">
                  <StatusDot status={status} size={6} ring />
                </span>
                <dt className="min-w-0 truncate text-[13.5px] leading-5 text-white/90">
                  {STATUS_TOKENS[status].label}
                </dt>
                <dd className="ml-auto pl-2 text-[13px] font-medium leading-5 tabular-nums text-white">
                  {counts ? counts[status] : "—"}
                </dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </div>
  );
};

export default StatsCard;
