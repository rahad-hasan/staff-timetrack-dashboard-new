"use client";
import NotificationIcon from "@/components/Icons/NotificationIcon";
import ProfilePlusIcon from "@/components/Icons/ProfilePlusIcon";
import { useLogInUserStore } from "@/store/logInUserStore";
import { Lock, Plug } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = "Profile" | "Configuration" | "Change Password" | "Integrations";

const SettingsTabs = () => {
    const logInUserData = useLogInUserStore((state) => state.logInUserData);

    const roleBasedTabs: Tab[] =
        logInUserData?.role === "admin"
            ? ["Profile", "Configuration", "Integrations", "Change Password"]
            : ["Profile", "Integrations", "Change Password"];

    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = (searchParams.get("tab") as Tab) ?? "Profile";
    const setTab = (tab: Tab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap gap-1 md:gap-3 mt-3 sm:mt-0 rounded-lg">
            {roleBasedTabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => setTab(tab)}
                    className={`flex items-center gap-1.5 px-2 md:px-4 py-2 h-10 text-xs md:text-sm font-medium outline outline-borderColor dark:outline-darkBorder transition-all cursor-pointer rounded-lg m-0.5 ${
                        activeTab === tab
                            ? "bg-primary/7 dark:bg-darkSecondaryBg text-primary outline-none"
                            : "text-subTextColor hover:text-gray-800 dark:text-darkTextPrimary"
                    }`}
                >
                    {tab === "Profile" && <ProfilePlusIcon size={16} />}
                    {tab === "Configuration" && <NotificationIcon size={16} />}
                    {tab === "Change Password" && <Lock size={16} />}
                    {tab === "Integrations" && <Plug size={16} />}
                    {tab}
                </button>
            ))}
        </div>
    );
};

export default SettingsTabs;
