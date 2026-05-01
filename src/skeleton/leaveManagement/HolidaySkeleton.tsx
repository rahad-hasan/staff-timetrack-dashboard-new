
const HolidaySkeleton = () => {
  // Helper for consistent pulse blocks
  const PulseBlock = ({ className }: { className: string }) => (
    <div className={`animate-pulse rounded bg-slate-200 dark:bg-gray-700 ${className}`} />
  );

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION SKELETON */}
      <div className="rounded-[12px] border border-borderColor p-3 sm:p-5 dark:border-darkBorder dark:bg-[linear-gradient(135deg,rgba(50,57,71,1)_0%,rgba(33,39,51,1)_100%)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <PulseBlock className="h-4 w-32" />
            <PulseBlock className="h-9 w-72 sm:w-80" />
            <div className="space-y-2">
               <PulseBlock className="h-4 w-full" />
               <PulseBlock className="h-4 w-5/6" />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <PulseBlock className="h-10 w-28" />
            <PulseBlock className="h-10 w-32" />
            <PulseBlock className="h-10 w-32" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <PulseBlock className="h-9 w-44 rounded-full" />
          <PulseBlock className="h-9 w-64 rounded-full" />
          <PulseBlock className="h-9 w-80 rounded-full" />
        </div>
      </div>

      {/* 2. STATS GRID (4 Columns) */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
            <div className="flex items-center justify-between gap-3 mb-3">
              <PulseBlock className="h-3 w-24" />
              <PulseBlock className="h-8 w-8 rounded-2xl" />
            </div>
            <PulseBlock className="h-9 w-16 mb-2" />
            <PulseBlock className="h-4 w-40" />
          </div>
        ))}
      </div>

      {/* 3. HOLIDAY TABLE SECTION */}
      <div className="rounded-[12px] border border-borderColor p-3 sm:p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <PulseBlock className="h-6 w-40" />
            <PulseBlock className="h-4 w-72 sm:w-96" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <PulseBlock className="h-10 w-full sm:w-[320px]" />
            <PulseBlock className="h-6 w-20 rounded-full" />
          </div>
        </div>

        {/* Desktop Table View Skeleton */}
        <div className="hidden md:block">
          <div className="border-b border-borderColor dark:border-darkBorder pb-4 flex justify-between px-2">
             {[...Array(6)].map((_, i) => (
               <PulseBlock key={i} className={`h-4 ${i === 0 ? 'w-32' : 'w-20'}`} />
             ))}
          </div>
          <div className="space-y-4 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center px-2 py-2 border-b border-borderColor dark:border-darkBorder last:border-0">
                <PulseBlock className="h-5 w-40" />
                <PulseBlock className="h-5 w-28" />
                <PulseBlock className="h-5 w-16" />
                <PulseBlock className="h-6 w-24 rounded-md" />
                <PulseBlock className="h-5 w-20" />
                <div className="flex gap-2">
                    <PulseBlock className="h-8 w-8 rounded-md" />
                    <PulseBlock className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Card View Skeleton */}
        <div className="grid gap-4 md:hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-[24px] border border-borderColor dark:border-darkBorder p-4 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <PulseBlock className="h-5 w-32" />
                  <PulseBlock className="h-4 w-24" />
                </div>
                <PulseBlock className="h-6 w-20 rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PulseBlock className="h-14 w-full rounded-2xl" />
                <PulseBlock className="h-14 w-full rounded-2xl" />
              </div>
              <PulseBlock className="h-12 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HolidaySkeleton;