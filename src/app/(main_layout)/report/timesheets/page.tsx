"use client"
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
                <div>
                    <h1 className=" text-2xl md:text-3xl font-semibold text-headingTextColor">All Timesheets</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the timesheet by team member who completed is displayed here
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="flex mt-3 sm:mt-0 bg-[#f6f7f9] rounded-lg overflow-hidden">
                        {["Daily", "Weekly", "Monthly"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Daily" | "Weekly" | "Monthly")}
                                className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                                    ? "bg-white text-headingTextColor shadow-sm"
                                    : "text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
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