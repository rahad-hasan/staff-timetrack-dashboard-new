const PulseBlock = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse rounded bg-slate-200 dark:bg-gray-700 ${className}`}
  />
);

/** Placeholder for a settings tab while its data or its code is on the way. */
const SettingsPanelSkeleton = () => (
  <div className="mt-5 space-y-5 rounded-[12px] border border-borderColor p-4 sm:p-6 dark:border-darkBorder">
    <div className="space-y-2">
      <PulseBlock className="h-6 w-48" />
      <PulseBlock className="h-4 w-72 max-w-full" />
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <PulseBlock className="h-4 w-28" />
          <PulseBlock className="h-10 w-full" />
        </div>
      ))}
    </div>
    <PulseBlock className="h-10 w-32" />
  </div>
);

export default SettingsPanelSkeleton;
