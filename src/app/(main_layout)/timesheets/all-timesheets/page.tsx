"use client";
// import { Button } from "@/components/ui/button";
import { useState } from "react";
// import { Plus } from "lucide-react";
import DailyTimeSheets from "@/components/TimeSheets/AllTimesheets/DailyTimeSheets/DailyTimeSheets";
import WeeklyTimeSheets from "@/components/TimeSheets/AllTimesheets/WeeklyTimeSheets/WeeklyTimeSheets";
import MonthlyTimeSheets from "@/components/TimeSheets/AllTimesheets/MonthlyTimeSheets/MonthlyTimeSheets";
import HeadingComponent from "@/components/Common/HeadingComponent";
import DayWeekMonthSelection from "@/components/Common/DayWeekMonthSelection";
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

                <DayWeekMonthSelection activeTab={activeTab} handleTabClick={handleTabClick}></DayWeekMonthSelection>
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
