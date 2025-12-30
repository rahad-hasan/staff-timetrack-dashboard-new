"use client";
import AllScreenShorts from "@/components/Activity/ScreenShorts/AllScreenShorts";
import Every10Mins from "@/components/Activity/ScreenShorts/Every10Mins";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, ClipboardList, NotepadText, SquareActivity, TrendingDown, TrendingUp, UsersRound } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { Suspense, useState } from "react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AllNotesModal from "@/components/Activity/ScreenShorts/AllNotes";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import AvgActivityIcon from "@/components/Icons/AvgActivityIcon";
import FocusTimeProjectIcon from "@/components/Icons/FocusTimeProjectIcon";
import TeamMemberIcon from "@/components/Icons/TeamMemberIcon";
import WorkedTimeIcon from "@/components/Icons/WorkedTimeIcon";

import teamMemberChart from '../../../../assets/dashboard/teamMemberChart.svg'
import totalProjectChart from '../../../../assets/dashboard/totalProjectChart.svg'
import weeklyActivityChart from '../../../../assets/dashboard/weeklyActivityChart.svg'
import weeklyWorkChart from '../../../../assets/dashboard/weeklyWorkChart.svg'
import darkProjectChart from '../../../../assets/dashboard/darkProjectChart.svg'
import darkTeamChart from '../../../../assets/dashboard/darkTeamChart.svg'
import darkWeeklyChart from '../../../../assets/dashboard/darkWeeklyChart.svg'
import darkWeeklyWorkChart from '../../../../assets/dashboard/darkWeeklyWorkChart.svg'
import Image from "next/image";
import { useTheme } from "next-themes";
// import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";
// import Every10MinsSkeleton from "@/skeleton/activity/screenShorts/Every10MinsSkeleton";

const ScreenShorts = () => {
    console.log('screenShorts');
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<"Every 10 min" | "All Screenshots">("Every 10 min");
    // const [value, setValue] = useState("")
    const handleTabClick = (tab: "Every 10 min" | "All Screenshots") => {
        setActiveTab(tab);
    };
    // const projects = [
    //     {
    //         value: "Time Tracker",
    //         label: "Time Tracker",
    //         avatar: "https://picsum.photos/200/300",
    //     },
    //     {
    //         value: "E-commerce",
    //         label: "E-commerce",
    //         avatar: "https://picsum.photos/200/300",
    //     },
    //     {
    //         value: "Fack News Detection",
    //         label: "Fack News Detection",
    //         avatar: "https://picsum.photos/200/300",
    //     },
    //     {
    //         value: "Travel Together",
    //         label: "Travel Together",
    //         avatar: "https://picsum.photos/200/300",
    //     },
    //     {
    //         value: "Time Tracker2",
    //         label: "Time Tracker2",
    //         avatar: "https://picsum.photos/200/300",
    //     },
    // ]
    // const users = [
    //     {
    //         value: "Juyed Ahmed",
    //         label: "Juyed Ahmed",
    //         avatar: "https://avatar.iran.liara.run/public/18",
    //     },
    //     {
    //         value: "Cameron Williamson",
    //         label: "Cameron Williamson",
    //         avatar: "https://avatar.iran.liara.run/public/19",
    //     },
    //     {
    //         value: "Jenny Wilson",
    //         label: "Jenny Wilson",
    //         avatar: "https://avatar.iran.liara.run/public/20",
    //     },
    //     {
    //         value: "Esther Howard",
    //         label: "Esther Howard",
    //         avatar: "https://avatar.iran.liara.run/public/21",
    //     },
    //     {
    //         value: "Walid Ahmed",
    //         label: "Walid Ahmed",
    //         avatar: "https://avatar.iran.liara.run/public/22",
    //     },
    // ]

    const metrics = [
        {
            id: 1,
            icon: SquareActivity,
            chart: theme === 'dark' ? darkWeeklyChart : weeklyActivityChart,
            value: "48%",
            title: "AVG ACTIVITY",
            change: "+1.5%",
            direction: "down",
            note: "last Monday",
        },
        {
            id: 2,
            icon: BriefcaseBusiness,
            chart: theme === 'dark' ? darkWeeklyWorkChart : weeklyWorkChart,
            value: "7h 24m",
            title: "WORKED TIME",
            change: "+30m",
            direction: "up",
            note: "last Monday",
        },
        {
            id: 3,
            icon: ClipboardList,
            chart: theme === 'dark' ? darkProjectChart : totalProjectChart,
            value: "4h 12m",
            title: "FOCUS TIME",
            change: "-15m",
            direction: "down",
            note: "last Monday",
        },
        {
            id: 4,
            icon: UsersRound,
            chart: theme === 'dark' ? darkTeamChart : teamMemberChart,
            value: "6h 02m",
            title: "CORE WORK",
            change: "+25m",
            direction: "up",
            note: "last Monday",
        },
    ];
    // date picker
    // const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    return (
        <div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-5">
                <HeadingComponent heading="Screenshot" subHeading="All the screenshot during the working hour by team member is here"></HeadingComponent>

                <div className="flex gap-3">
                    <div className="grid grid-cols-2 xl:flex mt-3 lg:mt-0 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg ">
                        {["Every 10 min", "All Screenshots"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Every 10 min" | "All Screenshots")}
                                className={`px-3.5 h-10 text-sm font-medium transition-all cursor-pointer rounded-lg text-center
                                    ${activeTab === tab
                                        ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor outline-1 outline-borderColor dark:outline-darkBorder shadow"
                                        : " text-headingTextColor dark:text-darkTextPrimary hover:text-gray-800"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    {/* <Button><Plus size={20} />Add Time</Button> */}
                </div>
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

                                <div>
                                    <Image src={chart} className=' w-18 2xl:w-20' width={150} height={150} alt='chart' />
                                </div>
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

            {
                activeTab === "Every 10 min" &&
                <Every10Mins></Every10Mins>
            }
            {/* {
                activeTab === "Every 10 min" &&
                <Every10MinsSkeleton></Every10MinsSkeleton>
            } */}
            {
                activeTab === "All Screenshots" &&
                <AllScreenShorts></AllScreenShorts>
            }
            {/* {
                activeTab === "All Screenshots" &&
                <AllScreenShortsSkeleton></AllScreenShortsSkeleton>
            } */}

        </div>
    );
};

export default ScreenShorts;