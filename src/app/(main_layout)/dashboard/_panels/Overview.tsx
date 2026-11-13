import { TrendingDown, TrendingUp } from "lucide-react";
import { TOUR_ANCHORS } from "@/lib/onboarding/anchors";
import { IDashboardStats, ISearchParamsProps } from "@/types/type";
import { getDashboardStats } from "@/actions/dashboard/action";
import { getCompanyInfo } from "@/actions/settings/action";
import { unstable_rethrow } from "next/navigation";
import { getSampleDataMode } from "@/lib/sampleData/getSampleDataMode";
import { sampleStats } from "@/lib/sampleData/fixtures";
import { getViewerTimeZone } from "@/lib/server/session";
import { requireLiveData } from "@/lib/server/liveData";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";
import HeroHeading from "@/components/Dashboard/HeroHeading";
import {
    parseDashboardTab,
    type DashboardTab,
} from "@/components/Dashboard/dashboardParams";
import WeeklyActivityColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyActivityColoredIcon";
import WeeklyWorkColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyWorkColoredIcon";
import TotalProjectColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TotalProjectColoredIcon";
import TeamMemberColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TeamMemberColoredIcon";
import FirstChart from "@/components/Icons/HeadingChartIcon/FirstChart";
import SecondChart from "@/components/Icons/HeadingChartIcon/SecondChart";

const HeroCart = async ({ searchParams }: ISearchParamsProps) => {
    const tab = parseDashboardTab((await searchParams).tab);

    // All four start together: the live read does not wait for the
    // sample-data gate (only a brand-new empty org wastes it), and the
    // heading's time zone and week start ride along instead of costing a hop
    // of their own.
    const [sampleMode, result, timeZone, company] = await Promise.all([
        getSampleDataMode(),
        getDashboardStats({ type: tab }),
        getViewerTimeZone(),
        // The week start the weekly stats are built from. The same GET the
        // (main_layout) layout makes in this render, so it is shared, not
        // repeated. Only the heading needs it: a failure falls back to Monday
        // instead of taking the stats down.
        getCompanyInfo().catch((error) => {
            unstable_rethrow(error);
            return null;
        }),
    ]);

    return (
        <div>
            <HeroHeading
                tab={tab}
                timeZone={timeZone}
                weekStart={company?.data?.week_start}
            ></HeroHeading>

            {/* Only the cards are in the boundary: the heading's period tabs
                steer the other panels too, so they stay usable while the
                stats read fails, and a tab change clears the failure. */}
            <LiveDataBoundary title="Overview" className="mb-5">
                <StatCards tab={tab} sampleMode={sampleMode} result={result} />
            </LiveDataBoundary>
        </div>
    );
};

/**
 * The four stat cards. A failed live read throws into the boundary around
 * them rather than rendering a "no data" hero that looks like the org is empty.
 */
function StatCards({
    tab,
    sampleMode,
    result,
}: {
    tab: DashboardTab;
    sampleMode: boolean;
    result: Awaited<ReturnType<typeof getDashboardStats>>;
}) {
    const data: IDashboardStats = sampleMode
        ? sampleStats(tab)
        : requireLiveData(result, "the dashboard stats").metrics;

    // 1. Create a Mapping for your static assets
    const metricConfig = {
        activity: {
            icon: <WeeklyActivityColoredIcon size={36} />,
        },
        work: {
            icon: <WeeklyWorkColoredIcon size={36} />,
        },
        projects: {
            icon: <TotalProjectColoredIcon size={36} />,
        },
        members: {
            icon: <TeamMemberColoredIcon size={36} />,
        },
    };

    const metrics = (Object.keys(data) as Array<keyof IDashboardStats>).map(
        (key) => {
            const apiData = data[key];
            const config = metricConfig[key];

            return {
                id: key,
                title: apiData?.label,
                value: apiData?.value,
                change: apiData?.change,
                isUp: apiData?.is_improved,
                icon: config?.icon,
                note:
                    tab === "daily"
                        ? "Yesterday"
                        : tab === "weekly"
                            ? "Last Weekly"
                            : "Last Month",
            };
        },
    );

    return (
        <div data-tour={TOUR_ANCHORS.dashboardStats} className="mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {metrics.map(({ id, icon, value, title, change, isUp, note }) => {
                const TrendIcon = isUp ? TrendingUp : TrendingDown;
                const trendColor = isUp ? "text-[#12cd69]" : "text-[#f40139]";

                return (
                    <div
                        key={id}
                        className="rounded-2xl w-full transition-all hover:shadow duration-200 relative h-34 2xl:h-40 shadow-sm dark:shadow-slate-100"
                    >
                        <div className=" border-x-1 border-t-1 border-borderColor/70  dark:border-darkBorder/40 flex items-center justify-between px-3 2xl:px-4 py-[1.4rem] 2xl:py-[1.8rem] bg-bgPrimary dark:bg-darkPrimaryBg rounded-t-2xl">
                            <div className="flex items-center gap-2 2xl:gap-3">
                                <div>{icon}</div>
                                <div>
                                    <h2 className="text-lg sm:text-2xl xl:text-xl 2xl:text-2xl font-medium text-headingTextColor dark:text-darkTextPrimary">
                                        {value}
                                    </h2>
                                    <h3 className="uppercase text-md xl:text-sm 2xl:text-[15px] text-subTextColor dark:text-darkTextSecondary">
                                        {title}
                                    </h3>
                                </div>
                            </div>
                            <div className=" w-16 sm:w-18 h-9 xl:w-[55px] xl:h-9 2xl:w-22 2xl:h-12">
                                {isUp ? (
                                    <div className="text-green-600">
                                        <FirstChart
                                            color={isUp ? "#3BC1A8" : "#FF0000"}
                                        ></FirstChart>
                                    </div>
                                ) : (
                                    <div className="text-red-600">
                                        <SecondChart
                                            color={isUp ? "#3BC1A8" : "#FF0000"}
                                        ></SecondChart>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-bgSecondary dark:bg-darkTertiaryBg rounded-b-2xl px-3 2xl:px-4 py-2 sm:py-2.5 2xl:py-3 flex items-center gap-2 absolute left-0 right-0 bottom-0">
                            <div className="w-5">
                                <TrendIcon size={20} className={trendColor} />
                            </div>
                            <p className={`${trendColor} font-medium`}>{change}</p>
                            <p
                                className={`text-md text-muted-foreground dark:text-darkTextSecondary`}
                            >
                                {note}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div >
    );
}

export default HeroCart;
