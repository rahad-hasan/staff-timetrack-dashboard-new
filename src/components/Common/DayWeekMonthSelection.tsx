"use client"
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";

type Tab = "daily" | "weekly" | "monthly";
const DayWeekMonthSelection = () => {
    const loader = useTopLoader();
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = (searchParams.get("tab") as Tab) ?? "daily";

    const setTab = (tab: Tab) => {
        const params = new URLSearchParams();
        const userId = searchParams.get("user_id");
        if (userId) {
            params.set("user_id", userId);
        }
        params.set("tab", tab);
        loader.start()
        router.push(`?${params}`);
    };
    return (
        <div className="grid grid-cols-3 lg:flex mt-3 w-[250px] lg:w-auto sm:mt-0 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg box-border ">
            {["daily", "weekly", "monthly"].map((tab) => (
                <button
                    key={tab}
                    onClick={() => {
                        setTab(tab as "daily" | "weekly" | "monthly")
                    }}
                    className={cn(
                        "px-3.5 h-10 text-sm font-medium transition-all cursor-pointer rounded-lg min-w-[70px] text-center capitalize",
                        activeTab === tab
                            ? "bg-bgPrimary dark:bg-darkPrimaryBg text-headingTextColor dark:text-darkTextPrimary outline-1 outline-borderColor dark:outline-darkBorder"
                            : "text-headingTextColor dark:text-darkTextPrimary hover:text-gray-800"
                    )}
                >
                    {tab}
                </button>
            ))
            }
        </div >
    );
};

export default DayWeekMonthSelection;
