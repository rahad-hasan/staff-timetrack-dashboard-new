"use client";
import GlobalColorPicker from "@/components/Common/GlobalColorPicker";
import HeadingComponent from "@/components/Common/HeadingComponent";
import NotificationIcon from "@/components/Icons/NotificationIcon";
import ProfilePlusIcon from "@/components/Icons/ProfilePlusIcon";
import SubscriptionManagementIcon from "@/components/Icons/SubscriptionManagementIcon";
import TimeTrackingIcon from "@/components/Icons/TimeTrackingIcon";
import UserRoleIcon from "@/components/Icons/UserRoleIcon";
import Configuration from "@/components/Settings/Configuration";
import Profile from "@/components/Settings/Profile";
import Subscription from "@/components/Settings/Subscription";
// import SubscriptionSkeleton from "@/skeleton/settings/SubscriptionSkeleton";
import { useState } from "react"

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState<"Profile" | "Configuration" | "User Role" | "Tracking" | "Subscription Management">("Profile");
    console.log("Dashboard Rendered", activeTab);

    const handleTabClick = (tab: "Profile" | "Configuration" | "User Role" | "Tracking" | "Subscription Management") => {
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
                {["Profile", "Configuration", "User Role", "Tracking", "Subscription Management"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabClick(tab as "Profile" | "Configuration" | "Subscription Management")}
                        className={`flex items-center gap-1.5 px-2 md:px-4 py-2 h-10 text-xs md:text-sm font-medium outline outline-borderColor dark:outline-darkBorder transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                            ? "bg-primary/7 dark:bg-darkSecondaryBg text-primary outline-none"
                            : "text-subTextColor hover:text-gray-800 dark:text-darkTextPrimary "
                            }`}
                    >
                        {
                            tab === "Profile" &&
                            <ProfilePlusIcon size={16}></ProfilePlusIcon>
                        }
                        {
                            tab === "Configuration" &&
                            <NotificationIcon size={16}></NotificationIcon>
                        }
                        {
                            tab === "User Role" &&
                            <UserRoleIcon size={16}></UserRoleIcon>
                        }
                        {
                            tab === "Tracking" &&
                            <TimeTrackingIcon size={16}></TimeTrackingIcon>
                        }
                        {
                            tab === "Subscription Management" &&
                            <SubscriptionManagementIcon size={16}></SubscriptionManagementIcon>
                        }
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
                <Configuration></Configuration>
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