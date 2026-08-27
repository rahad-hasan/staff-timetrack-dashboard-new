import { GROUP_ORDER } from "@/components/Download/downloadTargets";

const PlaceholderBlock = ({ className = "h-4 w-full" }) => (
  <div
    className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`}
  />
);

const DownloadPageSkeleton = () => {
  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <PlaceholderBlock className="h-8 w-72 max-w-full" />
          <PlaceholderBlock className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-3">
          <PlaceholderBlock className="h-6 w-16 rounded-full" />
          <PlaceholderBlock className="h-4 w-28" />
        </div>
      </div>

      {/* Recommended-download card */}
      <div className="mt-5 rounded-[12px] border border-borderColor p-5 dark:border-darkBorder">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <PlaceholderBlock className="size-14 rounded-xl" />
          <div className="flex-1 space-y-2">
            <PlaceholderBlock className="h-3 w-40" />
            <PlaceholderBlock className="h-5 w-56 max-w-full" />
          </div>
          <PlaceholderBlock className="h-12 w-full rounded-lg sm:w-52" />
        </div>
      </div>

      <PlaceholderBlock className="mt-6 h-3 w-28" />

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: GROUP_ORDER.length }).map((_, i) => (
          <div
            key={i}
            className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder"
          >
            <div className="flex items-center gap-3">
              <PlaceholderBlock className="size-10 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <PlaceholderBlock className="h-3 w-16" />
                <PlaceholderBlock className="h-5 w-32" />
              </div>
            </div>
            <PlaceholderBlock className="mt-4 h-4 w-full" />
            <PlaceholderBlock className="mt-4 h-12 w-full rounded-lg" />
            <PlaceholderBlock className="mt-3 h-3 w-28 mx-auto" />
          </div>
        ))}
      </div>

      <PlaceholderBlock className="mt-4 h-11 w-full rounded-[12px]" />
    </div>
  );
};

export default DownloadPageSkeleton;
