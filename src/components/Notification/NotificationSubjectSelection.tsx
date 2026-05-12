"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";


const NotificationSubjectSelection = ({ canSeeUnusualActivity }: { canSeeUnusualActivity: boolean }) => {
  const loader = useTopLoader();
  const searchParams = useSearchParams();
  const router = useRouter();

  const SUBJECT_FILTERS = [
    { label: "All", key: "all" },
    { label: "Event", key: "event" },
    { label: "Leave", key: "leave" },

    ...(canSeeUnusualActivity
    ? [{ label: "Unusual", key: "unusual_activity" }]
    : []),

    { label: "Project", key: "project" },
    { label: "Task", key: "task" },
  ] as const;

  type FilterKey = (typeof SUBJECT_FILTERS)[number]["key"];

  // Get active reasonType from URL, defaulting to 'all'
  const activeFilter = (searchParams.get("reasonType") as FilterKey) ?? "all";

  const setFilter = (key: FilterKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("reasonType", key);

    loader.start();
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {SUBJECT_FILTERS.map((reasonType) => {
        const isActive = activeFilter === reasonType.key;

        return (
          <button
            key={reasonType.key}
            onClick={() => setFilter(reasonType.key)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-1.5 rounded-3xl cursor-pointer border text-[11px] font-bold transition-all whitespace-nowrap leading-none",
              isActive
                ? "bg-primary text-white border-transparent shadow-md shadow-primary/10"
                : "bg-white dark:bg-[#2D333F] text-subTextColor dark:text-[#A0AEC0] border-gray-100 dark:border-[#3E4757] hover:border-primary/40"
            )}
          >
            <span className="flex items-center justify-center">
              {reasonType.label}
            </span>

            <span
              className={cn(
                "flex items-center justify-center px-2 py-[5px] rounded-full text-[10px] min-w-[20px]",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-bgSecondary/20 dark:bg-[#3E4757] text-[#718096] dark:text-gray-400"
              )}
            >
              0
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default NotificationSubjectSelection;