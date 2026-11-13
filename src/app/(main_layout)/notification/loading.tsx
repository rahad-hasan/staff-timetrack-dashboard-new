const PulseBlock = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse rounded bg-slate-200 dark:bg-gray-700 ${className}`}
  />
);

/**
 * The page reads the notification list and its counts before it can paint, so
 * a visit streams this outline at once instead of holding the previous screen.
 */
const NotificationLoading = () => (
  <div className="w-full">
    <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div className="flex items-center gap-4">
        <PulseBlock className="size-14 rounded-2xl" />
        <div className="space-y-2">
          <PulseBlock className="h-7 w-44" />
          <PulseBlock className="h-4 w-64" />
        </div>
      </div>
      <PulseBlock className="h-10 w-36 rounded-xl" />
    </div>

    <div className="mb-6 flex gap-8 border-b pb-3 dark:border-darkBorder">
      <PulseBlock className="h-5 w-12" />
      <PulseBlock className="h-5 w-16" />
      <PulseBlock className="h-5 w-12" />
    </div>

    <div className="mb-6 flex flex-wrap gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <PulseBlock key={index} className="h-7 w-20 rounded-3xl" />
      ))}
    </div>

    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-4 rounded-xl border border-borderColor p-5 dark:border-darkBorder"
        >
          <PulseBlock className="size-12 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <PulseBlock className="h-4 w-2/3" />
            <PulseBlock className="h-4 w-1/2" />
            <PulseBlock className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default NotificationLoading;
