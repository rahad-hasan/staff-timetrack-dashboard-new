const PulseBlock = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse rounded bg-slate-200 dark:bg-gray-700 ${className}`}
  />
);

/**
 * The page reads the member before it can paint, so opening a member streams
 * this outline at once instead of holding the members table on screen.
 */
const MemberDetailsLoading = () => (
  <div className="space-y-6">
    <div className="rounded-[12px] border border-borderColor p-4 sm:p-6 dark:border-darkBorder">
      <div className="flex items-start gap-3">
        <PulseBlock className="size-10 rounded-md" />
        <PulseBlock className="size-16 rounded-full" />
        <div className="space-y-2">
          <PulseBlock className="h-7 w-56" />
          <PulseBlock className="h-4 w-72" />
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <PulseBlock key={index} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>

    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-4 rounded-[12px] border border-borderColor p-4 sm:p-6 dark:border-darkBorder">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <PulseBlock className="h-4 w-24" />
              <PulseBlock className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <PulseBlock className="h-4 w-24" />
              <PulseBlock className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-[12px] border border-borderColor p-4 sm:p-6 dark:border-darkBorder">
        {Array.from({ length: 3 }).map((_, index) => (
          <PulseBlock key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

export default MemberDetailsLoading;
