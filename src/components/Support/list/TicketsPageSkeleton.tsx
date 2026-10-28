"use client";

import { Skeleton } from "@/components/Support/primitives";
import { SupportHero } from "./SupportHero";
import { TicketTableSkeleton } from "./TicketTable";

const noop = () => undefined;

/**
 * Route loading shell for /support/tickets (plan §5): the real hero (its
 * text is static) with the stats-card skeleton, the filter bar and the
 * table card with skeleton rows — the same boxes the page renders, so the
 * swap to data moves nothing. Buttons are disabled until the page is live.
 */
export const TicketsPageSkeleton = () => (
  <div className="@container/list flex w-full min-w-0 flex-col gap-6" aria-busy="true">
    <SupportHero
      counts={null}
      countsLoading
      live={false}
      refreshing={false}
      pending
      onCreate={noop}
      onRefresh={noop}
      onRetryCounts={noop}
    />
    <div aria-hidden="true" className="grid grid-cols-2 gap-3 @min-[960px]/list:flex">
      {["col-span-2 @min-[960px]/list:flex-1", "@min-[960px]/list:w-[200px]", "@min-[960px]/list:w-[220px]"].map(
        (layout) => (
          <div
            key={layout}
            className={`flex h-11 items-center rounded-lg border border-borderColor bg-white px-3.5 dark:border-darkBorder dark:bg-darkPrimaryBg ${layout}`}
          >
            <Skeleton className="h-3 w-24" />
          </div>
        ),
      )}
    </div>
    <TicketTableSkeleton />
  </div>
);

export default TicketsPageSkeleton;
