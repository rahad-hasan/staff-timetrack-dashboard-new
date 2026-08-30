"use client"
import NotificationIcon from "@/components/Icons/NotificationIcon";
import ProfilePlusIcon from "@/components/Icons/ProfilePlusIcon";
import { useLogInUserStore } from "@/store/logInUserStore";
import SubscriptionManagementIcon from "@/components/Icons/SubscriptionManagementIcon"
import { Blocks, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const SettingsTabs = () => {
    const logInUserData = useLogInUserStore(state => state.logInUserData);
    type Tab = "Profile" | "Configuration" | "App Integrations" | "Change Password" | "Subscription"

    // Billing reads are open to admin/manager/hr (billing guide §0) — the
    // Subscription tab is a route, not a query tab, so it lands on
    // /settings/billing (every block.webBillingUrl points there too).
    const roleBasedTabs = (logInUserData?.role === 'admin')
        ? ["Profile", "Configuration", "App Integrations", "Subscription", "Change Password"]
        : ["manager", "hr"].includes(logInUserData?.role)
            ? ["Profile", "Subscription", "Change Password"]
            : ["Profile", "Change Password"]

    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = (searchParams.get("tab") as Tab) ?? "Profile";
    const setTab = (tab: Tab) => {
        if (tab === "Subscription") {
            router.push("/settings/billing");
            return;
        }
        const params = new URLSearchParams(searchParams.toString());
        // `app` (open integration detail) only makes sense inside the
        // App Integrations tab — drop it so re-entering shows the hub
        params.delete("app");
        params.set("tab", tab);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex gap-1 md:gap-3 mt-3 sm:mt-0 rounded-lg">
            {roleBasedTabs.map((tab) => (
                // {["Profile", "Configuration", "User Role", "Tracking", "Subscription Management"].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setTab(tab as Tab)}
                    className={`flex items-center gap-1.5 px-2 md:px-4 py-2 h-10 text-xs md:text-sm font-medium outline outline-borderColor dark:outline-darkBorder transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                        ? "bg-primary/7 dark:bg-darkTertiaryBg text-primary outline-none"
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
                        tab === "App Integrations" &&
                        <Blocks size={16}></Blocks>
                    }
                    {
                        tab === "Change Password" &&
                        <Lock size={16}></Lock>
                    }
                    {
                        tab === "Subscription" &&
                        <SubscriptionManagementIcon size={16}></SubscriptionManagementIcon>
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