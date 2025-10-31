"use client"
import { Bell, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import { useState } from "react";
import CoreWork from "@/components/Insights/Performance/CoreWork";
import Utilization from "@/components/Insights/Performance/Utilization";
import DailyFocus from "@/components/Insights/Performance/DailyFocus";
import Activity from "@/components/Insights/Performance/Activity";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";

const Performance = () => {
    console.log('Performance');

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
            <div className="flex items-center justify-between gap-3 mb-5">
                <HeadingComponent heading="Performance" subHeading="All the Performance during the working hour by team member is here"></HeadingComponent>

                <div className=" flex items-center gap-1.5 sm:gap-3">
                    <button
                        className={`px-3 sm:px-4 py-2 sm:py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 hover:text-textGray dark:bg-darkSecondaryBg dark:text-darkTextSecondary border border-borderColor"
                                `}
                    >
                        <Bell size={20} /> <span className=" hidden sm:block">Smart Notification </span>
                    </button>
                    <button
                        className={`px-3 py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 dark:border-darkBorder hover:text-textGray border border-borderColor "
                                `}
                    >
                        <Settings className=" text-primary" size={20} />
                    </button>
                </div>
            </div>
            <div className=" mb-5 flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between">
                <div className=" flex flex-col md:flex-row gap-4 md:gap-3">
                    <SpecificDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></SpecificDatePicker>
                </div>
                <div className=" flex items-center gap-3">
                    <SelectUserDropDown users={users}></SelectUserDropDown>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Switch id="benchmarks" />
                <label
                    htmlFor="benchmarks"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700  cursor-pointer"
                >
                    <span className=" dark:text-darkTextPrimary">Benchmarks</span>
                    <span className="flex items-center gap-1 dark:text-darkTextPrimary">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 "></span>
                        Other Industry average
                    </span>
                </label>
            </div>
            {/* performance */}
            <div className="flex flex-col lg:flex-row gap-5 my-5">
                <Utilization></Utilization>
                <CoreWork></CoreWork>
            </div>
            <div className="flex flex-col lg:flex-row gap-5 my-5">
                <DailyFocus></DailyFocus>
                <Activity></Activity>
            </div>
        </div>
    );
};

export default Performance;