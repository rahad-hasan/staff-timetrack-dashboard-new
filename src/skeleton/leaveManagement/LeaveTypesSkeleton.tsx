import React from "react";

const LeaveTypesSkeleton = () => {
  const PulseBlock = ({ className }: { className: string }) => (
    <div className={`animate-pulse rounded bg-slate-200 dark:bg-gray-700 ${className}`} />
  );

  return (
    <div className="space-y-6">
      {/* 1. HEADER STUDIO AREA */}
      <div className="rounded-[12px] border border-borderColor p-3 sm:p-5 dark:border-darkBorder dark:bg-[linear-gradient(135deg,rgba(50,57,71,1)_0%,rgba(33,39,51,1)_100%)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <PulseBlock className="h-4 w-32" />
            <PulseBlock className="h-8 w-64" />
            <PulseBlock className="h-4 w-full" />
            <PulseBlock className="h-4 w-3/4" />
          </div>
          <div className="flex gap-3">
            <PulseBlock className="h-10 w-28 rounded-md" />
            <PulseBlock className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </div>

      {/* 2. STATS GRID (4 Columns) */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
            <PulseBlock className="h-3 w-24 mb-3" />
            <PulseBlock className="h-9 w-12 mb-2" />
            <PulseBlock className="h-4 w-40" />
          </div>
        ))}
      </div>

      {/* 3. POLICY CATALOG SECTION */}
      <div className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <PulseBlock className="h-6 w-40" />
            <PulseBlock className="h-4 w-72" />
          </div>
          <PulseBlock className="h-6 w-48 rounded-full" />
        </div>

        {/* Catalog Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-borderColor p-5 dark:border-darkBorder space-y-4">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <PulseBlock className="h-3 w-3 rounded-full" />
                  <PulseBlock className="h-5 w-32" />
                </div>
                <PulseBlock className="h-8 w-8 rounded-md" />
              </div>
              <div className="flex gap-2">
                <PulseBlock className="h-5 w-20 rounded-full" />
                <PulseBlock className="h-5 w-16 rounded-full" />
              </div>
              <PulseBlock className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <PulseBlock className="h-3 w-10" />
                <PulseBlock className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaveTypesSkeleton;