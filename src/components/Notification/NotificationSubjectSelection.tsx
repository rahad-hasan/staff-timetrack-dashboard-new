"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";

interface IBy_reason {
    event: number;
    leave: number;
    project: number;
    task: number;
    unusual_activity: number;
  }

const NotificationSubjectSelection = ({ canSeeUnusualActivity, by_reason, total }: { canSeeUnusualActivity: boolean, by_reason: IBy_reason, total: number }) => {
  const loader = useTopLoader();
  const searchParams = useSearchParams();
  const router = useRouter();

  const SUBJECT_FILTERS = [
    { label: "All", key: "all", count: total },
    { label: "Event", key: "event", count: by_reason.event },
    { label: "Leave", key: "leave", count: by_reason.leave },

    ...(canSeeUnusualActivity
    ? [{ label: "Unusual", key: "unusual_activity", count: by_reason.unusual_activity }]
    : []),

    { label: "Project", key: "project", count: by_reason.project },
    { label: "Task", key: "task", count: by_reason.task },
  ] as const;

  type FilterKey = (typeof SUBJECT_FILTERS)[number]["key"];

  const activeFilter = (searchParams.get("type") as FilterKey) ?? "all";

  const setFilter = (key: FilterKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", key);

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
              {reasonType.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default NotificationSubjectSelection;