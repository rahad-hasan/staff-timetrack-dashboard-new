"use client";
import AllScreenShorts from "@/components/Activity/ScreenShorts/AllScreenShorts";
import Every10Mins from "@/components/Activity/ScreenShorts/Every10Mins";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, ClipboardList, NotepadText, SlidersHorizontal, SquareActivity, TrendingDown, TrendingUp, UsersRound } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AllNotesModal from "@/components/Activity/ScreenShorts/AllNotes";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";

const ScreenShorts = () => {
    console.log('screenShorts');
    const [activeTab, setActiveTab] = useState<"Every 10 min" | "All Screenshots">("Every 10 min");

    const handleTabClick = (tab: "Every 10 min" | "All Screenshots") => {
        setActiveTab(tab);
    };

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

    // date picker
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                    <h1 className=" text-2xl md:text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">Screenshot</h1>
                    <p className="text-sm text-subTextColor mt-2 dark:text-darkTextPrimary">
                        All the screenshot during the working hour by team member is here
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="flex mt-3 sm:mt-0 bg-[#f6f7f9] dark:bg-darkPrimaryBg rounded-lg overflow-hidden">
                        {["Every 10 min", "All Screenshots"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Every 10 min" | "All Screenshots")}
                                className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                                    ? "bg-white dark:bg-primary text-headingTextColor shadow-sm"
                                    : "text-gray-600 hover:text-gray-800 dark:text-darkTextSecondary"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    {/* <Button><Plus size={20} />Add Time</Button> */}
                </div>
            </div>
            <div className="mb-5 flex flex-col gap-4 lg:gap-0 lg:flex-row justify-between">

                <div className=" flex gap-3">
                    <SpecificDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></SpecificDatePicker>
                    {/* Filter */}

                    <Button className=" hidden xl:flex dark:text-darkTextPrimary" variant={'filter'}>
                        <SlidersHorizontal className="dark:text-darkTextPrimary" /> Filters
                    </Button>

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
                    <SelectUserDropDown users={users}></SelectUserDropDown>
                </div>
            </div>
            <div className=" mb-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5">
                <div className=" border-2 border-borderColor rounded-2xl w-full dark:border-darkBorder">
                    <div className=" flex items-center gap-2 px-3 py-5">
                        <SquareActivity size={40} className=" border-2 border-borderColor rounded-lg p-1.5" />
                        <div>
                            <h2 className=" text-xl font-semibold dark:text-darkTextPrimary">48%</h2>
                            <h3 className=" text-textGray dark:text-darkTextSecondary">AVG ACTIVITY</h3>
                        </div>
                    </div>
                    <div className=" bg-[#f6f7f9] dark:bg-darkPrimaryBg rounded-b-xl px-3 py-3 flex items-center gap-2">
                        <TrendingDown size={20} className=" text-red-500" />
                        <p className=" text-primary">+1.5%</p>
                        <p>last Monday</p>
                    </div>
                </div>
                <div className=" border-2 border-borderColor rounded-2xl w-full dark:border-darkBorder">
                    <div className=" flex items-center gap-2 px-3 py-5">
                        <BriefcaseBusiness size={40} className=" border-2 border-borderColor rounded-lg p-1.5" />
                        <div>
                            <h2 className=" text-xl font-semibold dark:text-darkTextPrimary">48%</h2>
                            <h3 className=" text-textGray dark:text-darkTextSecondary">WORKED TIME</h3>
                        </div>
                    </div>
                    <div className=" bg-[#f6f7f9] dark:bg-darkPrimaryBg rounded-b-xl px-3 py-3 flex items-center gap-2">
                        <TrendingUp size={20} className=" text-green-500" />
                        <p className=" text-primary">+1.5%</p>
                        <p>last Monday</p>
                    </div>
                </div>
                <div className=" border-2 border-borderColor rounded-2xl w-full dark:border-darkBorder">
                    <div className=" flex items-center gap-2 px-3 py-5">
                        <ClipboardList size={40} className=" border-2 border-borderColor rounded-lg p-1.5" />
                        <div>
                            <h2 className=" text-xl font-semibold dark:text-darkTextPrimary">48%</h2>
                            <h3 className=" text-textGray dark:text-darkTextSecondary">FOCUS TIME</h3>
                        </div>
                    </div>
                    <div className=" bg-[#f6f7f9] dark:bg-darkPrimaryBg rounded-b-xl px-3 py-3 flex items-center gap-2">
                        <TrendingDown size={20} className=" text-red-500" />
                        <p className=" text-primary">+1.5%</p>
                        <p>last Monday</p>
                    </div>
                </div>
                <div className=" border-2 border-borderColor rounded-2xl w-full dark:border-darkBorder">
                    <div className=" flex items-center gap-2 px-3 py-5">
                        <UsersRound size={40} className=" border-2 border-borderColor rounded-lg p-1.5" />
                        <div>
                            <h2 className=" text-xl font-semibold dark:text-darkTextPrimary">48%</h2>
                            <h3 className=" text-textGray dark:text-darkTextSecondary">CORE WORK</h3>
                        </div>
                    </div>
                    <div className=" bg-[#f6f7f9] dark:bg-darkPrimaryBg rounded-b-xl px-3 py-3 flex items-center gap-2">
                        <TrendingUp size={20} className=" text-green-500" />
                        <p className=" text-primary">+1.5%</p>
                        <p>last Monday</p>
                    </div>
                </div>
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