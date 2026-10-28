import { Skeleton } from "@/components/Support/primitives";

/**
 * Loading state of `/support/tickets/[id]` with the page's own geometry
 * (TD-01 measurements: header card with the 36px back button / 29px TKT
 * chip row and the 52px tile centred on the 30px title + 26px pills; the
 * 1fr + 376px columns 16px apart; the 66px conversation header; 18px
 * timeline rhythm; the composer 24px below the thread; 20px aside cards),
 * so nothing shifts when the ticket renders.
 */
export const TicketSkeleton = () => (
  <div role="status" aria-label="Loading ticket" className="flex w-full min-w-0 flex-col gap-4">
    <div className="rounded-2xl border border-borderColor bg-[linear-gradient(90deg,#ecf3ff_0%,#f4f5ff_45%,#ffffff_100%)] p-5 sm:p-6 dark:border-darkBorder dark:bg-none dark:bg-darkSecondaryBg">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="size-9" />
        <Skeleton className="h-[29px] w-[120px]" />
        <Skeleton className="h-4 w-[230px] max-w-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="mt-5 flex items-center gap-4">
        <Skeleton className="size-[52px] shrink-0" rounded="lg" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-[30px] w-[60%] max-w-[480px] md:h-9" />
          <div className="mt-[7px] flex gap-2">
            <Skeleton className="h-[26px] w-24" rounded="full" />
            <Skeleton className="h-[26px] w-20" rounded="full" />
            <Skeleton className="h-[26px] w-28" rounded="full" />
          </div>
        </div>
      </div>
      {/* below lg the header always ends with the "Updated …" line (12 + 20) */}
      <Skeleton className="mt-3 h-5 w-32 lg:hidden" />
    </div>
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_376px] lg:items-start">
      <div className="rounded-2xl border border-borderColor bg-white dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="flex items-center gap-3 border-b border-borderColor px-4 py-[17px] sm:px-6 dark:border-darkBorder">
          <Skeleton className="size-8" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-20" rounded="full" />
        </div>
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="space-y-[18px]">
            <Skeleton className="ml-[50px] h-6 w-24" rounded="full" />
            {[0, 1, 2].map((index) => (
              <div key={index} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 sm:gap-3.5">
                <Skeleton className="size-9" rounded="full" />
                <Skeleton className="h-[86px] w-full" rounded="lg" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-6 h-[154px] w-full" rounded="lg" />
        </div>
      </div>
      <div className="flex flex-col gap-4 md:max-lg:grid md:max-lg:grid-cols-2">
        <div className="rounded-2xl border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="mt-[18px] flex items-center gap-3.5">
            <Skeleton className="size-12" rounded="full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <span className="sr-only">Loading ticket…</span>
  </div>
);

export default TicketSkeleton;
