"use client";
import AllScreenShorts from "@/components/Activity/ScreenShorts/AllScreenShorts";
import Every10Mins from "@/components/Activity/ScreenShorts/Every10Mins";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, ClipboardList, NotepadText, SquareActivity, TrendingDown, TrendingUp, UsersRound } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AllNotesModal from "@/components/Activity/ScreenShorts/AllNotes";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";

const ScreenShorts = () => {
    console.log('screenShorts');
    const [activeTab, setActiveTab] = useState<"Every 10 min" | "All Screenshots">("Every 10 min");

    const handleTabClick = (tab: "Every 10 min" | "All Screenshots") => {
        setActiveTab(tab);
    };
    const projects = [
        {
            value: "Time Tracker",
            label: "Time Tracker",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "E-commerce",
            label: "E-commerce",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "Fack News Detection",
            label: "Fack News Detection",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "Travel Together",
            label: "Travel Together",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "Time Tracker2",
            label: "Time Tracker2",
            avatar: "https://picsum.photos/200/300",
        },
    ]
    const users = [
        {
            value: "Juyed Ahmed",
            label: "Juyed Ahmed",
            avatar: "https://avatar.iran.liara.run/public/18",
        },
        {
            value: "Cameron Williamson",
            label: "Cameron Williamson",
            avatar: "https://avatar.iran.liara.run/public/19",
        },
        {
            value: "Jenny Wilson",
            label: "Jenny Wilson",
            avatar: "https://avatar.iran.liara.run/public/20",
        },
        {
            value: "Esther Howard",
            label: "Esther Howard",
            avatar: "https://avatar.iran.liara.run/public/21",
        },
        {
            value: "Walid Ahmed",
            label: "Walid Ahmed",
            avatar: "https://avatar.iran.liara.run/public/22",
        },
    ]

    const metrics = [
        {
            id: 1,
            icon: SquareActivity,
            value: "48%",
            title: "AVG ACTIVITY",
            change: "+1.5%",
            direction: "down",
            note: "last Monday",
        },
        {
            id: 2,
            icon: BriefcaseBusiness,
            value: "7h 24m",
            title: "WORKED TIME",
            change: "+30m",
            direction: "up",
            note: "from yesterday",
        },
        {
            id: 3,
            icon: ClipboardList,
            value: "4h 12m",
            title: "FOCUS TIME",
            change: "-15m",
            direction: "down",
            note: "from yesterday",
        },
        {
            id: 4,
            icon: UsersRound,
            value: "6h 02m",
            title: "CORE WORK",
            change: "+25m",
            direction: "up",
            note: "from yesterday",
        },
    ];
    // date picker
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="Screenshot" subHeading="All the screenshot during the working hour by team member is here"></HeadingComponent>

                <div className="flex gap-3">
                    <div className="flex mt-3 sm:mt-0 bg-[#f6f7f9] dark:bg-darkSecondaryBg rounded-lg overflow-hidden w-[255px]">
                        {["Every 10 min", "All Screenshots"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Every 10 min" | "All Screenshots")}
                                className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                                    ? "bg-white dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor shadow-sm"
                                    : "text-gray-600 hover:text-gray-800 dark:text-darkTextPrimary"
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

                <div className=" flex flex-col lg:flex-row gap-3">
                    <SpecificDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></SpecificDatePicker>
                    {/* Filter */}
                    {/* 
                    <Button className=" hidden xl:flex dark:text-darkTextPrimary" variant={'filter'}>
                        <SlidersHorizontal className="dark:text-darkTextPrimary" /> Filters
                    </Button> */}
                    <SelectProjectDropDown projects={projects}></SelectProjectDropDown>
                </div>
                <div className=" flex items-center gap-3">

                    <Dialog>
                        <form>
                            <DialogTrigger asChild>
                                <Button className="dark:text-darkTextPrimary" variant={'outline2'}>
                                    <NotepadText className=" text-sm md:text-base dark:text-darkTextPrimary" /> All Notes
                                </Button>
                            </DialogTrigger>
                            <AllNotesModal></AllNotesModal>
                        </form>
                    </Dialog>
                    <div className=" w-full">
                        <SelectUserDropDown users={users}></SelectUserDropDown>
                    </div>
                </div>
            </div>
            <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5">
                {metrics.map(({ id, icon: Icon, value, title, change, direction, note }) => {
                    const isUp = direction === "up";
                    const TrendIcon = isUp ? TrendingUp : TrendingDown;
                    const trendColor = isUp ? "text-green-500" : "text-red-500";

                    return (
                        <div
                            key={id}
                            className="border-2 border-borderColor rounded-2xl w-full dark:border-darkBorder transition-all hover:shadow-md  duration-200"
                        >
                            {/* Card header */}
                            <div className="flex items-center gap-2 px-3 py-5">
                                <Icon size={40} className="border-2 border-borderColor rounded-lg p-1.5" />
                                <div>
                                    <h2 className="text-xl font-semibold dark:text-darkTextPrimary">{value}</h2>
                                    <h3 className="text-textGray dark:text-darkTextSecondary">{title}</h3>
                                </div>
                            </div>

                            {/* Card footer */}
                            <div className="bg-[#f6f7f9] dark:bg-darkPrimaryBg rounded-b-xl px-3 py-3 flex items-center gap-2">
                                <TrendIcon size={20} className={trendColor} />
                                <p className="text-primary">{change}</p>
                                <p className="text-sm text-muted-foreground">{note}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {
                activeTab === "Every 10 min" &&
                <Every10Mins></Every10Mins>
            }
            {
                activeTab === "All Screenshots" &&
                <AllScreenShorts></AllScreenShorts>
            }

        </div>
    );
};

export default ScreenShorts;