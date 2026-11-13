const PulseBlock = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse rounded bg-slate-200 dark:bg-gray-700 ${className}`}
  />
);

/** Stands in for the monthly report's stat cards and charts while they load. */
const MonthlyReportSkeleton = () => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg"
        >
          <PulseBlock className="h-3 w-24" />
          <PulseBlock className="h-8 w-20" />
          <PulseBlock className="h-3 w-32" />
        </div>
      ))}
    </div>
    <div className="grid gap-6 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="space-y-4 rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg"
        >
          <PulseBlock className="h-5 w-40" />
          <PulseBlock className="h-64 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export default MonthlyReportSkeleton;
