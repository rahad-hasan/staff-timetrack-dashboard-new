"use client";
// import { Button } from "@/components/ui/button";
import { useState } from "react";
// import { Plus } from "lucide-react";
import DailyTimeSheets from "@/components/TimeSheets/AllTimesheets/DailyTimeSheets/DailyTimeSheets";
import WeeklyTimeSheets from "@/components/TimeSheets/AllTimesheets/WeeklyTimeSheets/WeeklyTimeSheets";
import MonthlyTimeSheets from "@/components/TimeSheets/AllTimesheets/MonthlyTimeSheets/MonthlyTimeSheets";

const AllTimeSheets = () => {
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
                    {/* <Button><Plus size={20} />Add Time</Button> */}
                </div>
            </div>
            {
                activeTab === "Daily" &&
                <DailyTimeSheets></DailyTimeSheets>
            }

            {
                activeTab === "Weekly" &&
                <WeeklyTimeSheets></WeeklyTimeSheets>
            }

            {
                activeTab === "Monthly" &&
                <MonthlyTimeSheets></MonthlyTimeSheets>
            }

        </div>
    );
};

export default AllTimeSheets;
