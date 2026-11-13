import SubscriptionSkeleton from "@/skeleton/settings/SubscriptionSkeleton";

const Bar = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`} />
);

/**
 * The plan picker reads billing status and the plan list before it paints —
 * the first screen after creating an organisation, so a blank pause there
 * reads as a failed signup. Streams the page's ground, headline and plan grid
 * instead. Outside `(main_layout)`, like the page, so it paints the ground.
 */
const ChoosePlanLoading = () => (
  <div className="min-h-screen w-full bg-bgSecondary dark:bg-darkSecondaryBg">
    <header className="flex items-center px-6 py-5 sm:px-8">
      <Bar className="h-9 w-32" />
    </header>
    <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6" aria-busy="true">
      <div className="mx-auto mb-8 flex w-full flex-col items-center gap-3">
        <Bar className="h-6 w-20 rounded-full" />
        <Bar className="mt-2 h-9 w-96 max-w-full" />
        <Bar className="h-4 w-80 max-w-full" />
      </div>
      <SubscriptionSkeleton />
    </main>
  </div>
);

export default ChoosePlanLoading;
