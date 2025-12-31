import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AllNotesModal from "@/components/Activity/ScreenShorts/AllNotes";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import { ISearchParamsProps } from "@/types/type";
import Every10MinsServer from "@/components/Activity/ScreenShorts/Every10MinsServer";
import ScreenshotsToggle from "@/components/Activity/ScreenShorts/ScreenshotsToggle";
// import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";
// import Every10MinsSkeleton from "@/skeleton/activity/screenShorts/Every10MinsSkeleton";
import AvgActivityIcon from "@/components/Icons/AvgActivityIcon";
import FocusTimeProjectIcon from "@/components/Icons/FocusTimeProjectIcon";
import TeamMemberIcon from "@/components/Icons/TeamMemberIcon";
import WorkedTimeIcon from "@/components/Icons/WorkedTimeIcon";
import { TrendingDown, TrendingUp, BriefcaseBusiness, ClipboardList, SquareActivity, UsersRound } from "lucide-react";
import teamMemberChart from '../../../../assets/dashboard/teamMemberChart.svg'
import totalProjectChart from '../../../../assets/dashboard/totalProjectChart.svg'
import weeklyActivityChart from '../../../../assets/dashboard/weeklyActivityChart.svg'
import weeklyWorkChart from '../../../../assets/dashboard/weeklyWorkChart.svg'
import FirstChart from "@/components/Icons/HeadingChartIcon/FirstChart";
import SecondChart from "@/components/Icons/HeadingChartIcon/SecondChart";

const ScreenShorts = ({ searchParams }: ISearchParamsProps) => {
    console.log('screenShorts');

    const metrics = [
        {
            id: 1,
            icon: SquareActivity,
            // chart: theme === 'dark' ? darkWeeklyChart : weeklyActivityChart,
            chart: weeklyActivityChart,
            value: "48%",
            title: "AVG ACTIVITY",
            change: "+1.5%",
            direction: "down",
            note: "last Monday",
        },
        {
            id: 2,
            icon: BriefcaseBusiness,
            // chart: theme === 'dark' ? darkWeeklyWorkChart : weeklyWorkChart,
            chart: weeklyWorkChart,
            value: "7h 24m",
            title: "WORKED TIME",
            change: "+30m",
            direction: "up",
            note: "last Monday",
        },
        {
            id: 3,
            icon: ClipboardList,
            // chart: theme === 'dark' ? darkProjectChart : totalProjectChart,
            chart: totalProjectChart,
            value: "4h 12m",
            title: "FOCUS TIME",
            change: "-15m",
            direction: "down",
            note: "last Monday",
        },
        {
            id: 4,
            icon: UsersRound,
            // chart: theme === 'dark' ? darkTeamChart : teamMemberChart,
            chart: teamMemberChart,
            value: "6h 02m",
            title: "CORE WORK",
            change: "+25m",
            direction: "up",
            note: "last Monday",
        },
    ];
    return (
        <div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-5">
                <HeadingComponent heading="Screenshot" subHeading="All the screenshot during the working hour by team member is here"></HeadingComponent>
                <ScreenshotsToggle></ScreenshotsToggle>

            </div>
            <div className="mb-5 flex flex-col gap-4 lg:gap-4 xl:flex-row justify-between">
                <Suspense fallback={null}>
                    <div className=" flex flex-col lg:flex-row gap-3">
                        <SpecificDatePicker></SpecificDatePicker>
                        {/* Filter */}
                        {/* 
                    <Button className=" hidden xl:flex dark:text-darkTextPrimary" variant={'filter'}>
                        <SlidersHorizontal className="dark:text-darkTextPrimary" /> Filters
                    </Button> */}
                        <SelectProjectDropDown></SelectProjectDropDown>
                    </div>
                </Suspense>
                <div className=" flex items-center gap-3">
                    <Dialog>
                        <form>
                            <DialogTrigger asChild>
                                <Button className="dark:text-darkTextPrimary h-10" variant={'outline2'}>
                                    <NotepadText className=" text-sm md:text-base dark:text-darkTextPrimary" /> All Notes
                                </Button>
                            </DialogTrigger>
                            <AllNotesModal></AllNotesModal>
                        </form>
                    </Dialog>
                    <Suspense fallback={null}>
                        <div className=" w-full">
                            <SelectUserDropDown></SelectUserDropDown>
                        </div>
                    </Suspense>
                </div>
            </div>

            <div className="mb-5 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5">
                {metrics.map(({ id, icon: Icon, chart, value, title, change, direction, note }) => {
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
                })}
            </div>
            <Every10MinsServer searchParams={searchParams}></Every10MinsServer>

        </div>
    );
};

export default ScreenShorts;