import { cn } from "@/lib/utils";

export function OngoingDot({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative inline-flex size-2 items-center justify-center", className)}
      aria-hidden
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-red-500" />
    </span>
  );
}

export function OngoingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:bg-red-500/15 dark:text-red-300">
      <OngoingDot />
      Ongoing
    </span>
  );
}
