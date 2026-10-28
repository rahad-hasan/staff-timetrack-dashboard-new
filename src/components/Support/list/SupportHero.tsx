"use client";

import { forwardRef, memo } from "react";
import { Headset, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketCounts } from "@/types/support";
import { HERO_GRADIENT, SupportButton } from "@/components/Support/primitives";
import { StatsCard } from "./StatsCard";

interface SupportHeroProps {
  counts: TicketCounts | null;
  countsLoading: boolean;
  live: boolean;
  refreshing: boolean;
  onCreate: () => void;
  /** warm the lazily loaded create dialog before the click lands */
  onCreateIntent?: () => void;
  onRefresh: () => void;
  onRetryCounts: () => void;
  /** seconds a Retry-After still holds Refresh (0 = free) */
  refreshWaitSeconds?: number;
  /** route-level loading shell: both buttons disabled until the page is interactive */
  pending?: boolean;
}

/**
 * The blue hero band (REQ-U-01/02), measured on UP-Default at 1440:
 * 1146×264, radius 16, a 146° #2c58c2 → #4a88e6 gradient, padding 28 top /
 * bottom, 36 left, 32 right; the "Support" chip, the 34px title, the 16px
 * subtitle (wraps after "follow up"), the two 40px buttons and the 440×208
 * stats card. Two 1px white/7% rings (r 437 and 302, centred near the stats
 * card's top-left) are the drawn decorative arcs.
 *
 * Below a 960px content width the card drops under the text at full width
 * (plan §6); under 640 the padding is 20 and the title 28/34.
 */
const SupportHeroImpl = forwardRef<HTMLButtonElement, SupportHeroProps>(
  (
    {
      counts,
      countsLoading,
      live,
      refreshing,
      onCreate,
      onCreateIntent,
      onRefresh,
      onRetryCounts,
      refreshWaitSeconds = 0,
      pending = false,
    },
    createRef,
  ) => (
    <section
      aria-labelledby="support-hero-title"
      data-support-hero
      className="relative isolate overflow-hidden rounded-2xl text-white"
      style={{ backgroundImage: HERO_GRADIENT }}
    >
      {/* The drawn arcs are anchored to the right edge, so on a narrower band they slide left over the
          subtitle and their white/7% hairline drops it below 4.5:1 (sampled: 4.1 at 1280). They clear
          the text only above a ~1040 px band, so they are drawn from 1100 up (1440 = as drawn). */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -z-10 size-[874px] rounded-full border border-white/[0.07] @max-[1099px]/list:hidden"
        style={{ right: -268, top: -397 }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -z-10 size-[604px] rounded-full border border-white/[0.07] @max-[1099px]/list:hidden"
        style={{ right: -118, top: -252 }}
      />
      <div
        className={cn(
          "flex flex-col gap-6 p-5",
          "@min-[640px]/list:p-6",
          "@min-[960px]/list:flex-row @min-[960px]/list:items-start @min-[960px]/list:justify-between @min-[960px]/list:gap-8 @min-[960px]/list:pb-7 @min-[960px]/list:pl-9 @min-[960px]/list:pr-8 @min-[960px]/list:pt-7",
        )}
      >
        <div className="flex min-w-0 flex-col items-start">
          {/* Deep-blue glass, not the drawn white/14 (white 12.5px on it read 4.3:1) — `support-hero-glass`, tokens.ts. */}
          <span className="inline-flex h-8 items-center gap-2 rounded-full border border-white/25 bg-support-hero-glass pl-1 pr-3 text-[12.5px] font-medium leading-none">
            <span
              aria-hidden="true"
              className="flex size-[22px] items-center justify-center rounded-full bg-white text-[#3360c8]"
            >
              <Headset size={14} strokeWidth={2} />
            </span>
            Support
          </span>
          <h1
            id="support-hero-title"
            className="mt-3.5 text-[28px] font-medium leading-[34px] @min-[640px]/list:text-[34px] @min-[640px]/list:leading-10"
          >
            My Support Tickets
          </h1>
          {/* 14 + 20 (not 13 + 21): the drawn subtitle ink sits 1px lower while the buttons stay put (UP-Default 2× ink scan).
              Solid white, not the drawn white/90 (3.96:1 on the band's #3d74d7; white ≥ 4.6 with the px-stop gradient). */}
          <p className="mt-[14px] max-w-[392px] text-[16px] leading-6 text-white">
            Track your open support conversations and follow up with the team.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <SupportButton
              ref={createRef}
              variant="hero"
              icon={<Plus strokeWidth={2} />}
              onClick={onCreate}
              onPointerEnter={onCreateIntent}
              onFocus={onCreateIntent}
              aria-haspopup="dialog"
              disabled={pending}
              data-support-create
            >
              Create ticket
            </SupportButton>
            <SupportButton
              variant="heroGhost"
              icon={
                <RefreshCw
                  strokeWidth={2}
                  className={cn(refreshing && "motion-safe:animate-spin")}
                />
              }
              onClick={() => {
                // aria-disabled (not disabled) while refreshing or held by a Retry-After: the
                // button keeps keyboard focus.
                if (!refreshing && refreshWaitSeconds === 0) onRefresh();
              }}
              disabled={pending}
              aria-disabled={refreshing || refreshWaitSeconds > 0 || undefined}
              aria-busy={refreshing || undefined}
              title={refreshWaitSeconds > 0 ? `Too many requests — try again in ${refreshWaitSeconds}s` : undefined}
              className="border-white/30 disabled:opacity-100 aria-disabled:opacity-100"
              data-support-refresh
            >
              Refresh
            </SupportButton>
          </div>
        </div>
        <StatsCard
          counts={counts}
          loading={countsLoading}
          skeleton={pending}
          live={live}
          onRetry={onRetryCounts}
          className="@min-[960px]/list:w-[440px]"
        />
      </div>
    </section>
  ),
);

SupportHeroImpl.displayName = "SupportHero";

/** Memoised: typing in the search or paging never re-renders the hero. */
export const SupportHero = memo(SupportHeroImpl);

export default SupportHero;
