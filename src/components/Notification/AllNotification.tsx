/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { readNotifications } from "@/actions/notification/action";
import { INotificationItem } from "@/types/type";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Check, Bell, Calendar, Clock, AlertTriangle, LucideIcon, Briefcase, CheckSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import BellIcon from "../Icons/BellIcon";

const TABS = [
    { label: "All", key: "all", count: 45 },
    { label: "Unread", key: "unread", count: 30 },
    { label: "Read", key: "read", count: 15 },
];

const SUBJECT_FILTERS = [
    { label: "All Types", count: 45 },
    { label: "Task Assignment", count: 3 },
    { label: "Change Logs", count: 3 },
    { label: "Task Overdue", count: 1 },
    { label: "Meetings", count: 17 },
    { label: "Work Reports", count: 21 },
];

const REASON_CONFIG: Record<string, { label: string, icon: LucideIcon, colorClass: string }> = {
    event: {
        label: "Meeting/Event",
        icon: Clock,
        colorClass: "text-purple-500 bg-purple-50 dark:bg-purple-900/20"
    },
    leave: {
        label: "Leave Request",
        icon: Calendar,
        colorClass: "text-gray-500 dark:text-white/80"
    },
    unusual_activity: {
        label: "Unusual Activity",
        icon: AlertTriangle,
        colorClass: "text-red-500 bg-red-50 dark:bg-red-900/20"
    },
    project: {
        label: "Project Update",
        icon: Briefcase,
        colorClass: "text-orange-500 bg-orange-50 dark:bg-orange-900/20"
    },
    task: {
        label: "Task Assignment",
        icon: CheckSquare,
        colorClass: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
    },
    default: {
        label: "Notification",
        icon: Bell,
        colorClass: "text-gray-500 bg-gray-50 dark:bg-gray-800/40"
    }
};

const NotificationItem = ({ notification }: { notification: INotificationItem }) => {
    console.log(notification)
    const createdAt = parseISO(notification?.created_at);
    const [loading, setLoading] = useState(false);

    const config = REASON_CONFIG[notification.reason] || { label: "General", icon: Bell, colorClass: "text-primary bg-primary/10" };
    const Icon = config.icon;

    async function handleReadNotification(id: number) {
        setLoading(true);
        try {
            const res = await readNotifications({ data: { ids: [id] } });
            if (res?.success) toast.success("Marked as read");
        } catch (error: any) {
            toast.error("Something went wrong!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={`group relative flex items-start gap-4 p-5 mb-4 rounded-xl border border-primary/60 dark:border-darkBorder transition-all duration-200 shadow-sm
            ${!notification?.is_read
                ? "bg-white dark:bg-darkSecondaryBg "
                : "bg-bgSecondary/10 dark:bg-darkSecondaryBg/40 border-transparent opacity-80"}`}>

            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${config.colorClass} border border-white/50 dark:border-darkBorder shadow-sm`}>
                <Icon size={22} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {(notification.reason === 'work_report' || notification.reason === 'task_overdue') && (
                        <AlertTriangle size={16} className="text-yellow-600" />
                    )}

                    <h3 className={`text-sm sm:text-[15px] font-bold leading-tight ${!notification.is_read ? 'text-headingTextColor dark:text-darkTextPrimary' : 'text-subTextColor dark:text-darkTextSecondary'}`}>
                        {notification?.message}
                    </h3>

                    {!notification.is_read && <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />}

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-darkBorder text-gray-500 dark:text-darkTextSecondary uppercase tracking-wider">
                        {config.label}
                    </span>
                </div>

                <p className="text-sm text-subTextColor dark:text-darkTextSecondary mb-2 line-clamp-2">
                    {notification?.data?.note || "Click to view details about this notification."}
                </p>

                <div className="flex items-center gap-2 text-subTextColor dark:text-darkTextSecondary opacity-70">
                    <Clock size={14} />
                    <span className="text-xs">{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
                </div>
            </div>

            <div className="flex items-center gap-3 self-center">
                {!notification.is_read && (
                    <button
                        disabled={loading}
                        onClick={() => handleReadNotification(notification.id)}
                        className="p-2 rounded-lg hover:bg-primary/10 cursor-pointer text-subTextColor dark:text-darkTextSecondary hover:text-primary transition-colors"
                        title="Mark as read"
                    >
                        <Check size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

const AllNotification = ({ data }: { data: any }) => {
    const notifications = data?.data || [];
    console.log(notifications)
    const [activeTab, setActiveTab] = useState("all");

    return (
        <div className="w-full mx-auto min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary relative">
                        <BellIcon size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-headingTextColor dark:text-darkTextPrimary">Notifications</h1>
                        <p className="text-sm text-subTextColor dark:text-darkTextSecondary">Stay updated with your tasks and meetings</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20">
                    <Check size={18} /> Mark all as read
                </button>
            </div>

            <div className="flex items-center gap-8 border-b dark:border-darkBorder mb-6">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer ${activeTab === tab.key ? "text-primary" : "text-subTextColor dark:text-darkTextSecondary"
                            }`}
                    >
                        <div className=" flex items-center gap-2">
                            {tab.label}
                            <span className={` px-2 py-0.5 rounded-md text-[10px] ${activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-darkBorder'}`}>
                                {tab.count}
                            </span>
                        </div>
                        {activeTab === tab.key && (
                            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3 mb-6 py-2">
                <span className="text-xs font-bold text-subTextColor dark:text-darkTextSecondary uppercase tracking-widest mr-2 whitespace-nowrap">
                    Subject:
                </span>
                {SUBJECT_FILTERS.map((filter) => (
                    <button
                        key={filter.label}
                        className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-3xl cursor-pointer border text-[11px] font-bold transition-all whitespace-nowrap leading-none ${filter.label === "All Types"
                            ? "bg-primary text-white border-transparent shadow-md shadow-primary/10"
                            : "bg-white dark:bg-[#2D333F] text-subTextColor dark:text-[#A0AEC0] border-gray-100 dark:border-[#3E4757] hover:border-primary/40"
                            }`}
                    >
                        <span className="flex items-center justify-center">{filter.label}</span>
                        <span className={`flex items-center justify-center px-2 py-[5px] rounded-full text-[10px] min-w-[20px] ${filter.label === "All Types"
                            ? "bg-white/20"
                            : "bg-bgSecondary/20 dark:bg-[#3E4757] text-[#718096] dark:text-gray-400"
                            }`}>
                            {filter.count}
                        </span>
                    </button>
                ))}
            </div>

            {notifications.length > 0 ? (
                <div className="space-y-1">
                    {notifications.map((notification: INotificationItem) => (
                        <NotificationItem key={notification.id} notification={notification} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-white dark:bg-darkSecondaryBg rounded-3xl border border-dashed border-gray-200 dark:border-darkBorder">
                    <p className="text-subTextColor dark:text-darkTextSecondary font-medium">You don&apos;t have any notifications right now.</p>
                </div>
            )}
        </div>
    );
};

export default AllNotification;