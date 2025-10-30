"use client";

import HeadingComponent from "@/components/Common/HeadingComponent";
import Notification from "@/components/Settings/Notification";
import Profile from "@/components/Settings/Profile";
import Subscription from "@/components/Settings/Subscription";
import { useState } from "react"

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState<"Profile" | "Notification" | "Subscription Management">("Profile");
    console.log("Dashboard Rendered", activeTab);

    const handleTabClick = (tab: "Profile" | "Notification" | "Subscription Management") => {
        setActiveTab(tab);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="Settings" subHeading="All the teams and member are displayed here"></HeadingComponent>
            </div>
            <div className="flex gap-1 md:gap-3 mt-3 sm:mt-0 rounded-lg">
                {["Profile", "Notification", "Subscription Management"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabClick(tab as "Profile" | "Notification" | "Subscription Management")}
                        className={`px-2 md:px-4 py-2 text-xs md:text-sm font-medium border transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                            ? "bg-[#e9f8f0] text-primary border-none"
                            : "text-gray-600 hover:text-gray-800 dark:text-darkTextSecondary"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            {
                activeTab === "Profile" &&
                <Profile></Profile>
            }
            {
                activeTab === "Notification" &&
                <Notification></Notification>
            }
            {
                activeTab === "Subscription Management" &&
                <Subscription></Subscription>
            }
        </div>
    );
};

export default SettingsPage;