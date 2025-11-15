"use client";
// import { Button } from "@/components/ui/button";
import { useState } from "react";
// import { Plus } from "lucide-react";
import DailyTimeSheets from "@/components/TimeSheets/AllTimesheets/DailyTimeSheets/DailyTimeSheets";
import WeeklyTimeSheets from "@/components/TimeSheets/AllTimesheets/WeeklyTimeSheets/WeeklyTimeSheets";
import MonthlyTimeSheets from "@/components/TimeSheets/AllTimesheets/MonthlyTimeSheets/MonthlyTimeSheets";
import HeadingComponent from "@/components/Common/HeadingComponent";
// import MonthlyTimeSheetsCalendarSkeleton from "@/skeleton/timesheets/allTimesheets/MonthlyTimeSheetsCalendarSkeleton";
// import WeeklyTimeSheetsSkeleton from "@/skeleton/timesheets/allTimesheets/WeeklyTimeSheetsSkeleton";
// import DailyTimeSheetsSkeleton from "@/skeleton/timesheets/allTimesheets/DailyTimeSheetsSkeleton";

const AllTimeSheets = () => {
    const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "Monthly">("Daily");

    const handleTabClick = (tab: "Daily" | "Weekly" | "Monthly") => {
        setActiveTab(tab);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="All Timesheets" subHeading="All the timesheet by team member who completed is displayed here"></HeadingComponent>

                <div className="flex gap-3">
                    <div className="flex mt-3 sm:mt-0 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg overflow-hidden">
                        {["Daily", "Weekly", "Monthly"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Daily" | "Weekly" | "Monthly")}
                                className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                                    ? "bg-bgPrimary text-headingTextColor shadow-sm dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                                    : "text-subTextColor dark:text-darkTextPrimary hover:text-gray-800"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    {/* <Button><Plus size={20} />Add Time</Button> */}
                </div>
            </div>
            {
                activeTab === "Daily" &&
                <DailyTimeSheets></DailyTimeSheets>
            }
            {/* {
                activeTab === "Daily" &&
                <DailyTimeSheetsSkeleton></DailyTimeSheetsSkeleton>
            } */}

            {
                activeTab === "Weekly" &&
                <WeeklyTimeSheets></WeeklyTimeSheets>
            }
            {/* {
                activeTab === "Weekly" &&
                <WeeklyTimeSheetsSkeleton></WeeklyTimeSheetsSkeleton>
            } */}

            {
                activeTab === "Monthly" &&
                <MonthlyTimeSheets></MonthlyTimeSheets>
            }
            {/* {
                activeTab === "Monthly" &&
                <MonthlyTimeSheetsCalendarSkeleton></MonthlyTimeSheetsCalendarSkeleton>
            } */}

        </div>
    );
};

export default AllTimeSheets;
