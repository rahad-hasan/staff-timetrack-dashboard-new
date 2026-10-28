import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

const RADIUS: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded-[4px]",
  md: "rounded-[8px]",
  lg: "rounded-[12px]",
  full: "rounded-full",
};

/** One pulsing block. Same tone as the app's other skeletons (gray-200 / gray-700). */
export const Skeleton = ({ className, rounded = "md" }: SkeletonProps) => (
  <div
    aria-hidden="true"
    className={cn("animate-pulse bg-gray-200 dark:bg-gray-700", RADIUS[rounded], className)}
  />
);

/** The hero stats card while counts load (same 440×208 glass box). */
export const StatsCardSkeleton = ({ className }: { className?: string }) => (
  <div
    aria-hidden="true"
    className={cn(
      "flex h-[208px] w-full max-w-[440px] flex-col rounded-[14px] border border-white/25 bg-support-stats-glass px-[22px] pt-5",
      className,
    )}
  >
    <Skeleton className="h-3 w-20 bg-white/25 dark:bg-white/25" />
    <div className="mt-3 flex items-end justify-between">
      <Skeleton className="h-8 w-24 bg-white/25 dark:bg-white/25" />
      <Skeleton className="h-[22px] w-14 bg-white/25 dark:bg-white/25" rounded="full" />
    </div>
    <Skeleton className="mt-[18px] h-2 w-full bg-white/25 dark:bg-white/25" rounded="full" />
    <div className="mt-5 grid grid-cols-2 gap-x-10 gap-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-3 w-full bg-white/25 dark:bg-white/25" />
      ))}
    </div>
  </div>
);

export default Skeleton;
