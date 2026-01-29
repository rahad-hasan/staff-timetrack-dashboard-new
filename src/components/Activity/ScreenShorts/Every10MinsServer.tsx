import { getScreenshots10Min } from "@/actions/screenshots/action";
import Every10MinsSkeleton from "@/skeleton/activity/screenShorts/Every10MinsSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Suspense } from "react";
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
    project_id: params?.project_id
  });

  return (
    <div className="min-h-[80vh] xl:h-auto">
      <div className="mb-5 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5">
        <ScreenshotActivityCard
          icon={WeeklyActivityColoredIcon}
          value={result?.data?.score + "%"}
          level="AVG ACTIVITY"
          chart={FirstChart}
          is_improved={true}
          improved_value={"+1.5%"}
        />
        <ScreenshotActivityCard
          icon={WeeklyWorkColoredIcon}
          value={result?.data?.work_time}
          level="WORKED TIME"
          chart={SecondChart}
          is_improved={true}
          improved_value={"+30m"}
        />
        <ScreenshotActivityCard
          icon={TotalProjectColoredIcon}
          value={result?.data?.mouse_activity + "%"}
          level="MOUSE ACTIVITY"
          chart={FirstChart}
          is_improved={false}
          improved_value={"-2.5%"}
        />
        <ScreenshotActivityCard
          icon={TeamMemberColoredIcon}
          value={result?.data?.keyboard_activity + "%"}
          level="KEYBOARD ACTIVITY"
          chart={SecondChart}
          is_improved={true}
          improved_value={"+3.5%"}
        />

        {/* {metrics.map(({ id, value, title, change, direction, note }) => {
                    const isUp = direction === "up";
                    const TrendIcon = isUp ? TrendingUp : TrendingDown;
                    const trendColor = isUp ? "text-[#12cd69]" : "text-[#f40139]";

                    return (
                        <div
                            key={id}
                            className="border border-borderColor rounded-2xl w-full dark:border-darkBorder transition-all hover:shadow duration-200 relative h-38"
                        >
                            <div className="flex items-center justify-between px-4 py-5 bg-bgPrimary dark:bg-darkPrimaryBg rounded-t-2xl">
                                <div className=' flex items-center gap-3'>
                                    <div className=' border border-borderColor dark:border-darkBorder p-2 text-subTextColor dark:text-darkTextSecondary rounded-lg'>

                                        {
                                            title === "AVG ACTIVITY" &&
                                            <AvgActivityIcon size={22} />
                                        }
                                        {
                                            title === "WORKED TIME" &&
                                            <FocusTimeProjectIcon size={22} />
                                        }
                                        {
                                            title === "FOCUS TIME" &&
                                            <TeamMemberIcon size={22} />
                                        }
                                        {
                                            title === "CORE WORK" &&
                                            <WorkedTimeIcon size={22} />
                                        }
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-medium text-headingTextColor dark:text-darkTextPrimary">{value}</h2>
                                        <h3 className=" uppercase text-subTextColor dark:text-darkTextSecondary">{title}</h3>
                                    </div>
                                </div>
                                {
                                    change === "-15m" ?
                                        <div className="text-red-600">
                                            <FirstChart></FirstChart>
                                        </div>
                                        :
                                        <div className="text-[#2bb0f3]">
                                            <SecondChart></SecondChart>
                                        </div>
                                }

                            </div>

                            <div className="bg-bgSecondary dark:bg-darkSecondaryBg rounded-b-2xl border-t px-4 py-3 flex items-center gap-2 absolute left-0 right-0 bottom-0">
                                <TrendIcon size={20} className={trendColor} />
                                <p className={`${trendColor}`}>{change}</p>
                                <p className={`text-md text-muted-foreground dark:text-darkTextSecondary`}>{note}</p>
                            </div>
                        </div>
                    );
                })} */}
      </div>
      <Suspense fallback={<Every10MinsSkeleton />}>
        {<Every10Mins data={result?.data?.interval_rows} />}
      </Suspense>

    </div>
  );
};

export default Every10MinsServer;
