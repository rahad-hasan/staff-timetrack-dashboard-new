"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";

interface ISummary {
  all: number;
  read: number;
  unread: number;
}

const NotificationTabs = ({ summary }: { summary: ISummary }) => {
  const loader = useTopLoader();
  const searchParams = useSearchParams();
  const router = useRouter();

  const TABS = [
    { label: "All", key: "all", count: summary.all },
    { label: "Unread", key: "unread", count: summary.unread },
    { label: "Read", key: "read", count: summary.read },
  ] as const;
  type TabKey = (typeof TABS)[number]["key"];

  const activeTab = (searchParams.get("read") as TabKey) ?? "all";

  const setTab = (tab: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("read", tab);

    loader.start();
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-8 border-b dark:border-darkBorder mb-6">
      {TABS.map((read) => {
        const isActive = activeTab === read.key;

        return (
          <button
            key={read.key}
            onClick={() => setTab(read.key)}
            className={cn(
              "pb-3 text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer",
              isActive
                ? "text-primary"
                : "text-subTextColor dark:text-darkTextSecondary"
            )}
          >
            <div className="flex items-center gap-2">
              {read.label}
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px]",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-gray-100 dark:bg-darkBorder"
                )}
              >
                {read.count}
              </span>
            </div>

            {isActive && (
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default NotificationTabs;