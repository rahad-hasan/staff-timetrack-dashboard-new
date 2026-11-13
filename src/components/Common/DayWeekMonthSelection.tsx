"use client"
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import { parseDashboardTab, type DashboardTab } from "@/components/Dashboard/dashboardParams";

type Tab = DashboardTab;
const DayWeekMonthSelection = () => {
    const loader = useTopLoader();
    const searchParams = useSearchParams();
    const router = useRouter();
    // The same parser the server slots use, so an invalid ?tab highlights the
    // Daily button the page actually renders.
    const activeTab = parseDashboardTab(searchParams.get("tab"));

    const setTab = (tab: Tab) => {
        // Change only the period: every other filter — the core-members
        // ranking (?type=), the user — must survive the switch.
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        loader.start()
        // One request renders every panel for the new period, and Back
        // restores the old one from the router cache until the next refresh
        // (see DashboardPanel). Not pushState plus router.refresh(): that
        // re-renders the layouts too and drops every cached period, and when
        // both run in one handler the refreshed panels never show at all.
        router.push(`?${params}`);
    };
    return (
        <div className="grid grid-cols-3 lg:flex mt-3 w-[250px] lg:w-auto sm:mt-0 bg-bgSecondary dark:bg-darkTertiaryBg rounded-lg box-border ">
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
