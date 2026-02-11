import { getScreenshots10Min } from "@/actions/screenshots/action";
import { ISearchParamsProps } from "@/types/type";
import Every10Mins from "./Every10Mins";
import FirstChart from "@/components/Icons/HeadingChartIcon/FirstChart";
import SecondChart from "@/components/Icons/HeadingChartIcon/SecondChart";
import { cookies } from "next/headers";
import { format } from "date-fns";
import WeeklyActivityColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyActivityColoredIcon";
import WeeklyWorkColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyWorkColoredIcon";
import TotalProjectColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TotalProjectColoredIcon";
import TeamMemberColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TeamMemberColoredIcon";
import ScreenshotActivityCard from "./ScreenshotActivityCard";
// import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";

const Every10MinsServer = async ({ searchParams }: ISearchParamsProps) => {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const params = await searchParams;
    const currentDate = format(new Date(), "yyyy-MM-dd");

    const result = await getScreenshots10Min({
        date: params.date ?? currentDate,
        user_id: params.user_id ?? userId,
        project_id: params?.project_id,
        timezone: params?.timezone,
    });

    // console.log('Every 10 Min Server Loaded', result);

    return (
        <div className="min-h-[80vh] xl:h-auto">

                <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <ScreenshotActivityCard
                        icon={WeeklyActivityColoredIcon}
                        value={result?.data?.score + "%"}
                        level="AVG ACTIVITY"
                        chart={FirstChart}
                        is_improved={true}
                    //   improved_value={"+1.5%"}
                    />
                    <ScreenshotActivityCard
                        icon={WeeklyWorkColoredIcon}
                        value={result?.data?.work_time}
                        level="WORKED TIME"
                        chart={SecondChart}
                        is_improved={true}
                    //   improved_value={"+30m"}
                    />
                    <ScreenshotActivityCard
                        icon={TotalProjectColoredIcon}
                        value={result?.data?.mouse_activity + "%"}
                        level="MOUSE ACTIVITY"
                        chart={FirstChart}
                        is_improved={false}
                    //   improved_value={"-2.5%"}
                    />
                    <ScreenshotActivityCard
                        icon={TeamMemberColoredIcon}
                        value={result?.data?.keyboard_activity + "%"}
                        level="KEYBOARD ACTIVITY"
                        chart={SecondChart}
                        is_improved={true}
                    //   improved_value={"+3.5%"}
                    />
                </div>
                {<Every10Mins data={result?.data?.interval_rows} />}

        </div>
    );
};

export default Every10MinsServer;
