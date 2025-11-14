"use client";
import GlobalColorPicker from "@/components/Common/GlobalColorPicker";
import HeadingComponent from "@/components/Common/HeadingComponent";
import Notification from "@/components/Settings/Notification";
import Profile from "@/components/Settings/Profile";
import Subscription from "@/components/Settings/Subscription";
// import SubscriptionSkeleton from "@/skeleton/settings/SubscriptionSkeleton";
import { useState } from "react"

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState<"Profile" | "Configuration" | "Subscription Management">("Profile");
    console.log("Dashboard Rendered", activeTab);

    const handleTabClick = (tab: "Profile" | "Configuration" | "Subscription Management") => {
        setActiveTab(tab);
    };

    return (
        <div>
            <div className=" flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-5">
                    <HeadingComponent heading="Settings" subHeading="All the teams and member are displayed here"></HeadingComponent>
                </div>
                <GlobalColorPicker></GlobalColorPicker>
            </div>

            <div className="flex gap-1 md:gap-3 mt-3 sm:mt-0 rounded-lg">
                {["Profile", "Configuration", "Subscription Management"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabClick(tab as "Profile" | "Configuration" | "Subscription Management")}
                        className={`px-2 md:px-4 py-2 text-xs md:text-sm font-medium border dark:border-darkBorder transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                            ? "bg-primary/7 dark:bg-darkSecondaryBg text-primary border-none"
                            : "text-gray-600 hover:text-gray-800 dark:text-darkTextPrimary "
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
                activeTab === "Configuration" &&
                <Notification></Notification>
            }
            {
                activeTab === "Subscription Management" &&
                <Subscription></Subscription>
            }
            {/* {
                activeTab === "Subscription Management" &&
                <SubscriptionSkeleton></SubscriptionSkeleton>
            } */}
        </div>
    );
};

export default SettingsPage;