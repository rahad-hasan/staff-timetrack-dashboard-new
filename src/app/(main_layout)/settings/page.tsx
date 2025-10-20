"use client";

import Profile from "@/components/Settings/Profile";
import { useState } from "react"

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState<"Profile" | "Notification" | "User Role" | "Tracking" | "Subscription Management">("Profile");
    console.log("Dashboard Rendered", activeTab);

    const handleTabClick = (tab: "Profile" | "Notification" | "User Role" | "Tracking" | "Subscription Management") => {
        setActiveTab(tab);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-semibold text-headingTextColor">Settings</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the teams and member are displayed here
                    </p>
                </div>
            </div>
            <div className="flex gap-3 mt-3 sm:mt-0 rounded-lg">
                {["Profile", "Notification", "User Role", "Tracking", "Subscription Management"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabClick(tab as "Profile" | "Notification" | "User Role" | "Tracking" | "Subscription Management")}
                        className={`px-4 py-2 text-sm font-medium border transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                            ? "bg-[#e9f8f0] text-primary border-none"
                            : "text-gray-600 hover:text-gray-800"
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
        </div>
    );
};

export default SettingsPage;