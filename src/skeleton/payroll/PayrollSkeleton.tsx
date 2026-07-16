const PulseBlock = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded bg-slate-200 dark:bg-gray-700 ${className}`} />
);

const PayrollSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-[12px] border border-borderColor p-3 sm:p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <PulseBlock className="h-4 w-32" />
            <PulseBlock className="h-9 w-72 sm:w-80" />
            <PulseBlock className="h-4 w-full" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <PulseBlock className="h-10 w-32" />
            <PulseBlock className="h-10 w-32" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <PulseBlock className="h-3 w-24" />
              <PulseBlock className="h-8 w-8 rounded-2xl" />
            </div>
            <PulseBlock className="mb-2 h-9 w-16" />
            <PulseBlock className="h-4 w-40" />
          </div>
        ))}
      </div>

      <div className="rounded-[12px] border border-borderColor p-3 sm:p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-borderColor pb-3 last:border-0 dark:border-darkBorder"
            >
              <PulseBlock className="h-5 w-32" />
              <PulseBlock className="h-5 w-24" />
              <PulseBlock className="h-5 w-20" />
              <PulseBlock className="h-6 w-20 rounded-md" />
              <PulseBlock className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PayrollSkeleton;
