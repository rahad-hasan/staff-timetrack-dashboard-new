import SubscriptionSkeleton from "@/skeleton/settings/SubscriptionSkeleton";

const Bar = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`} />
);

/**
 * The page reads billing status and the plan list before it can paint, so the
 * route streams the My Plan tab's shape — tab strip, current-plan card, pricing
 * grid — instead of holding the previous page with no sign of progress.
 * Switching tabs never shows this: tabs are history entries, not navigations.
 */
const BillingLoading = () => (
  <div className="mt-4 space-y-4 sm:space-y-6">
    <div className="flex justify-between">
      <Bar className="h-10 w-72 rounded-lg" />
      <Bar className="h-5 w-32" />
    </div>
    <div className="rounded-lg border border-borderColor bg-white p-3 sm:p-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
      <Bar className="mb-3 h-4 w-24" />
      <Bar className="mb-4 h-7 w-48" />
      <div className="space-y-2">
        <Bar className="h-4 w-40" />
        <Bar className="h-4 w-56" />
      </div>
    </div>
    <div className="rounded-lg border border-borderColor bg-white p-3 sm:p-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
      <Bar className="mb-4 h-6 w-20 rounded-full" />
      <Bar className="h-9 w-80 max-w-full" />
      <SubscriptionSkeleton />
    </div>
  </div>
);

export default BillingLoading;
