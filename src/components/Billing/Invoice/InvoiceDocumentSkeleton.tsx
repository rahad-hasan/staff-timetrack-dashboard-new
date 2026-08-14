const Bar = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`} />
);

/**
 * First-paint placeholder for the document. The detail read can sit behind a
 * one-off Stripe reconciliation, so the page shows structure rather than an
 * empty state while it waits.
 */
export default function InvoiceDocumentSkeleton() {
  return (
    <div className="rounded-lg border border-borderColor bg-white p-4 sm:p-8 dark:border-darkBorder dark:bg-darkPrimaryBg">
      <div className="flex items-start justify-between">
        <Bar className="h-7 w-32" />
        <Bar className="h-7 w-28" />
      </div>

      <div className="mt-6 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Bar key={`meta-${index}`} className="h-4 w-64" />
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, column) => (
          <div key={`party-${column}`} className="space-y-2">
            <Bar className="h-4 w-40" />
            <Bar className="h-3 w-52" />
            <Bar className="h-3 w-44" />
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {Array.from({ length: 3 }).map((_, row) => (
          <Bar key={`line-${row}`} className="h-5 w-full" />
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <div className="w-full max-w-xs space-y-2">
          {Array.from({ length: 4 }).map((_, row) => (
            <Bar key={`total-${row}`} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
