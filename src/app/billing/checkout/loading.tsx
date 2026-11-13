const Bar = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`} />
);

/**
 * The checkout reads the plan list and prices the order before it paints, so
 * the route streams the page's own frame — the same ground, header and
 * two-column grid as `CheckoutPageClient` — instead of leaving the plan grid
 * or the seat dialog on screen with no sign the click was taken.
 *
 * Outside `(main_layout)`, like the page, so it paints the ground itself.
 */
const CheckoutLoading = () => (
  <div className="min-h-screen w-full bg-bgSecondary dark:bg-darkSecondaryBg">
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Bar className="h-9 w-20 rounded-lg" />

      <div className="mt-6 mb-6 space-y-2">
        <Bar className="h-8 w-72 max-w-full" />
        <Bar className="h-4 w-96 max-w-full" />
      </div>

      <div
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]"
        aria-busy="true"
      >
        <section className="rounded-xl border border-borderColor bg-bgPrimary p-5 dark:border-darkBorder dark:bg-darkPrimaryBg sm:p-6">
          <Bar className="mb-5 h-6 w-40" />
          <div className="space-y-3">
            <Bar className="h-10 rounded-lg" />
            <Bar className="h-10 rounded-lg" />
            <Bar className="h-10 w-2/3 rounded-lg" />
          </div>
          <Bar className="mt-6 h-11 rounded-lg" />
        </section>

        <section className="rounded-xl border border-borderColor bg-bgPrimary p-5 dark:border-darkBorder dark:bg-darkPrimaryBg sm:p-6">
          <Bar className="mb-5 h-6 w-36" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex justify-between gap-4">
                <Bar className="h-4 w-32" />
                <Bar className="h-4 w-16" />
              </div>
            ))}
          </div>
          <Bar className="mt-6 h-7 w-full" />
        </section>
      </div>
    </div>
  </div>
);

export default CheckoutLoading;
