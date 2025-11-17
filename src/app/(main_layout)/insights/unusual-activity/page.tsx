"use client"
import { Bell, Settings } from "lucide-react";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import { useState } from "react";
import UnusualActivityTable from "@/components/Insights/UnusualActivity/UnusualActivityTable";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";

const UnusualActivity = () => {
    console.log('Performance');
    const [activeTab, setActiveTab] = useState<"Highly Unusual" | "Unusual" | "Slightly Unusual">("Highly Unusual");
    console.log("Dashboard Rendered", activeTab);

    const handleTabClick = (tab: "Highly Unusual" | "Unusual" | "Slightly Unusual") => {
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
            <div className="flex items-center justify-between gap-3 mb-5">
                <HeadingComponent heading="Unusual Activity" subHeading="All the Unusual activity during the working hour by team member is here"></HeadingComponent>

                <div className=" flex items-center gap-1.5 sm:gap-3">
                    <button
                        className={`px-3 sm:px-4 py-2 sm:py-[7px] flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 hover:text-textGray bg-bgSecondary dark:bg-darkPrimaryBg dark:text-darkTextSecondary border border-borderColor"
                                `}
                    >
                        <Bell size={20} /> <span className=" hidden sm:block">Smart Notification </span>
                    </button>
                    <button
                        className={`px-3 py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 dark:border-darkBorder hover:text-textGray border border-borderColor bg-bgSecondary dark:bg-darkPrimaryBg"
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
            <div className="flex mt-3 sm:mt-0 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg w-[340px] sm:w-[368px]">
                {["Highly Unusual", "Unusual", "Slightly Unusual"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabClick(tab as "Highly Unusual" | "Unusual" | "Slightly Unusual")}
                        className={`px-3 py-2 text-[13px] sm:text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                            ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor shadow-sm"
                            : "text-subTextColor dark:text-darkTextPrimary hover:text-gray-800"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <UnusualActivityTable></UnusualActivityTable>
        </div>
    );
};

export default UnusualActivity;