"use client"
import NotificationIcon from "@/components/Icons/NotificationIcon";
import ProfilePlusIcon from "@/components/Icons/ProfilePlusIcon";
// import SubscriptionManagementIcon from "@/components/Icons/SubscriptionManagementIcon"
import { Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const SettingsTabs = () => {
    type Tab = "Profile" | "Configuration" | "Change Password"
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = (searchParams.get("tab") as Tab) ?? "Profile";
    const setTab = (tab: Tab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex gap-1 md:gap-3 mt-3 sm:mt-0 rounded-lg">
            {["Profile", "Configuration", "Change Password"].map((tab) => (
                // {["Profile", "Configuration", "User Role", "Tracking", "Subscription Management"].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setTab(tab as "Profile" | "Configuration" | "Change Password")}
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
                        tab === "Change Password" &&
                        <Lock size={16}></Lock>
                    }
                    {/* {
                            tab === "User Role" &&
                            <UserRoleIcon size={16}></UserRoleIcon>
                        }
                        {
                            tab === "Tracking" &&
                            <TimeTrackingIcon size={16}></TimeTrackingIcon>
                        } */}
                    {/* {
                        tab === "Subscription Management" &&
                        <SubscriptionManagementIcon size={16}></SubscriptionManagementIcon>
                    } */}
                    {tab}
                </button>
            ))}
        </div>
    );
};

export default SettingsTabs;