import { Skeleton } from "@/components/Support/primitives";

/** The form card's shape while the categories load. */
const NewTicketLoading = () => (
  <div role="status" aria-label="Loading the ticket form" className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
    <Skeleton className="h-5 w-40" />
    <div className="space-y-2">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-4 w-[70%]" />
    </div>
    <div className="space-y-5 rounded-2xl border border-borderColor bg-white p-5 sm:p-6 dark:border-darkBorder dark:bg-darkSecondaryBg">
      {[0, 1, 2].map((row) => (
        <div key={row} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-[148px] w-full" />
      </div>
      <Skeleton className="h-[66px] w-full" />
      <div className="flex justify-end gap-2.5">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-[132px]" />
      </div>
    </div>
    <span className="sr-only">Loading…</span>
  </div>
);

export default NewTicketLoading;
