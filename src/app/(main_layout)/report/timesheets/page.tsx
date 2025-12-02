"use client"
import DayWeekMonthSelection from "@/components/Common/DayWeekMonthSelection";
import HeadingComponent from "@/components/Common/HeadingComponent";
import ReportDailyTimeSheet from "@/components/Report/TimeSheets/ReportDailyTimeSheet";
import ReportMonthlyTimeSheet from "@/components/Report/TimeSheets/ReportMonthlyTimeSheet";
import ReportWeeklyTimeSheet from "@/components/Report/TimeSheets/ReportWeeklyTimeSheet";
import { useState } from "react";

const ReportTimeSheets = () => {
    console.log("ReportTimeSheets");
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
                <ReportDailyTimeSheet></ReportDailyTimeSheet>
            }
            {
                activeTab === "Weekly" &&
                <ReportWeeklyTimeSheet></ReportWeeklyTimeSheet>
            }
            {
                activeTab === "Monthly" &&
                <ReportMonthlyTimeSheet></ReportMonthlyTimeSheet>
            }
        </div>
    );
};

export default ReportTimeSheets;