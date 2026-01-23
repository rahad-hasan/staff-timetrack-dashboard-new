import { getScreenshots10Min } from "@/actions/screenshots/action";
import Every10MinsSkeleton from "@/skeleton/activity/screenShorts/Every10MinsSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Suspense } from "react";
import Every10Mins from "./Every10Mins";
import FirstChart from "@/components/Icons/HeadingChartIcon/FirstChart";
import SecondChart from "@/components/Icons/HeadingChartIcon/SecondChart";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cookies } from "next/headers";
import { format } from "date-fns";
import WeeklyActivityColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyActivityColoredIcon";
import WeeklyWorkColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyWorkColoredIcon";
import TotalProjectColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TotalProjectColoredIcon";
import TeamMemberColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TeamMemberColoredIcon";
// import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";


const Every10MinsServer = async ({ searchParams }: ISearchParamsProps) => {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const params = await searchParams;
    const currentDate = format(new Date(), "yyyy-MM-dd");

    const result = await getScreenshots10Min({
        date: params.date ?? currentDate,
        user_id: params.user_id ?? userId,
    });

    return (
        <div>
            <div className="mb-5 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5">
                <div className="border border-borderColor rounded-2xl w-full dark:border-darkBorder transition-all hover:shadow duration-200 relative h-38">
                    <div className="flex items-center justify-between px-4 py-5 bg-bgPrimary dark:bg-darkPrimaryBg rounded-t-2xl">
                        <div className=' flex items-center gap-3'>
                            <WeeklyActivityColoredIcon size={36} />
                            <div>
                                <h2 className="text-2xl font-medium text-headingTextColor dark:text-darkTextPrimary">{result?.data?.score}%</h2>
                                <h3 className=" uppercase text-subTextColor dark:text-darkTextSecondary">AVG ACTIVITY</h3>
                            </div>
                        </div>
                        <div className="text-green-600">
                            <FirstChart></FirstChart>
                        </div>
                    </div>
                    <div className="bg-bgSecondary dark:bg-darkSecondaryBg rounded-b-2xl border-t px-4 py-3 flex items-center gap-2 absolute left-0 right-0 bottom-0">
                        <TrendingUp size={20} className={"text-[#12cd69]"} />
                        <p className={"text-[#12cd69]"}>+1.5%</p>
                        <p className={`text-md text-muted-foreground dark:text-darkTextSecondary`}>last Monday</p>
                    </div>
                </div>

                <div className="border border-borderColor rounded-2xl w-full dark:border-darkBorder transition-all hover:shadow duration-200 relative h-38">
                    <div className="flex items-center justify-between px-4 py-5 bg-bgPrimary dark:bg-darkPrimaryBg rounded-t-2xl">
                        <div className=' flex items-center gap-3'>
                            <WeeklyWorkColoredIcon size={36} />
                            <div>
                                <h2 className="text-2xl font-medium text-headingTextColor dark:text-darkTextPrimary">{result?.data?.work_time}</h2>
                                <h3 className=" uppercase text-subTextColor dark:text-darkTextSecondary">WORKED TIME</h3>
                            </div>
                        </div>
                        <div className="text-red-600">
                            <SecondChart></SecondChart>
                        </div>
                    </div>
                    <div className="bg-bgSecondary dark:bg-darkSecondaryBg rounded-b-2xl border-t px-4 py-3 flex items-center gap-2 absolute left-0 right-0 bottom-0">
                        <TrendingUp size={20} className={"text-[#12cd69]"} />
                        <p className={"text-[#12cd69]"}>+30m</p>
                        <p className={`text-md text-muted-foreground dark:text-darkTextSecondary`}>last Monday</p>
                    </div>
                </div>

                <div className="border border-borderColor rounded-2xl w-full dark:border-darkBorder transition-all hover:shadow duration-200 relative h-38">
                    <div className="flex items-center justify-between px-4 py-5 bg-bgPrimary dark:bg-darkPrimaryBg rounded-t-2xl">
                        <div className=' flex items-center gap-3'>
                            <TotalProjectColoredIcon size={36} />
                            <div>
                                <h2 className="text-2xl font-medium text-headingTextColor dark:text-darkTextPrimary">{result?.data?.mouse_activity}%</h2>
                                <h3 className=" uppercase text-subTextColor dark:text-darkTextSecondary">MOUSE ACTIVITY</h3>
                            </div>
                        </div>
                        <div className="text-red-500">
                            <SecondChart></SecondChart>
                        </div>
                    </div>
                    <div className="bg-bgSecondary dark:bg-darkSecondaryBg rounded-b-2xl border-t px-4 py-3 flex items-center gap-2 absolute left-0 right-0 bottom-0">
                        <TrendingDown size={20} className={"text-red-500"} />
                        <p className={"text-red-500"}>-15m</p>
                        <p className={`text-md text-muted-foreground dark:text-darkTextSecondary`}>last Monday</p>
                    </div>
                </div>

                <div className="border border-borderColor rounded-2xl w-full dark:border-darkBorder transition-all hover:shadow duration-200 relative h-38">
                    <div className="flex items-center justify-between px-4 py-5 bg-bgPrimary dark:bg-darkPrimaryBg rounded-t-2xl">
                        <div className=' flex items-center gap-3'>
                            <TeamMemberColoredIcon size={36} />
                            <div>
                                <h2 className="text-2xl font-medium text-headingTextColor dark:text-darkTextPrimary">{result?.data?.keyboard_activity}%</h2>
                                <h3 className=" uppercase text-subTextColor dark:text-darkTextSecondary">KEYBOARD ACTIVITY</h3>
                            </div>
                        </div>
                        <div className="text-green-600">
                            <FirstChart></FirstChart>
                        </div>
                    </div>
                    <div className="bg-bgSecondary dark:bg-darkSecondaryBg rounded-b-2xl border-t px-4 py-3 flex items-center gap-2 absolute left-0 right-0 bottom-0">
                        <TrendingUp size={20} className={"text-[#12cd69]"} />
                        <p className={"text-[#12cd69]"}>+30m</p>
                        <p className={`text-md text-muted-foreground dark:text-darkTextSecondary`}>last Monday</p>
                    </div>
                </div>

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
                {
                    <Every10Mins data={result?.data?.interval_rows} />
                }
            </Suspense>
        </div>
    );
};

export default Every10MinsServer;