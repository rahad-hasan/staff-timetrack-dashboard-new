/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { readNotifications } from "@/actions/notification/action";
import { INotificationItem } from "@/types/type";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const NotificationItem = ({ notification }: { notification: INotificationItem }) => {
    const date = parseISO(notification?.data?.date);
    const [loading, setLoading] = useState(false);

    async function handleReadNotification(id: number) {
        setLoading(true);
        try {
            const res = await readNotifications({ data: { ids: [id] } });
            console.log("success:", res);

            if (res?.success) {
                toast.success(res?.message || "Member edited successfully");
            } else {
                toast.error(res?.message || "Failed to edit member");
            }
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className={`flex items-start gap-4 py-3 px-4 mb-2 rounded-lg
            bg-bgSecondary dark:bg-darkSecondaryBg
            border-l-4 shadow transition-colors
            ${!notification?.is_read ? "border-primary" : "border-transparent"}
        `}>
            <div className="flex-1 min-w-0">
                <p
                    className={`text-sm sm:text-base font-medium leading-tight
                    ${!notification?.is_read
                            ? "text-headingTextColor dark:text-gray-200"
                            : "text-subTextColor dark:text-gray-200"}
                `}
                >
                    {notification?.message}
                </p>

                {notification?.data?.name && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-200">
                        {notification?.data?.name}
                    </p>
                )}

                <div className=" flex items-center gap-1 mt-1.5">
                    <p className=" text-[10px] sm:text-xs text-subTextColor dark:text-darkTextSecondary opacity-80">
                        {formatDistanceToNow(date, { addSuffix: true })}
                    </p>
                    {!notification?.is_read && (
                        <span
                            className="inline-block w-2 h-2 bg-red-500 rounded-full"
                            aria-label="New notification"
                        />
                    )}
                </div>

            </div>

            <div className="flex  gap-1 flex-shrink-0 self-center">
                <div className="text-[10px] sm:text-xs text-subTextColor dark:text-darkTextSecondary text-right">
                    <div>{format(date, "MMM d, yyyy")}</div>
                    <div>{format(date, "h:mm a")}</div>
                </div>
                {
                    !notification?.is_read &&
                    <button disabled={loading} className=" flex items-center">
                        <Check onClick={() => handleReadNotification(notification?.id)} className=" text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-1 cursor-pointer" size={25} />
                    </button>
                }
            </div>
        </div>
    );
};

const AllNotification = ({ data }: { data: any }) => {
    const notifications = data?.data || [];

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-xl font-medium text-headingTextColor dark:text-darkTextPrimary">
                    Notifications
                </h2>
                {/* <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    Mark All as Read
                </button> */}
            </div>

            {notifications.length > 0 ? (
                <div>
                    {notifications.map((notification: INotificationItem) => (
                        <NotificationItem key={notification.id} notification={notification} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 px-2 bg-gray-50 dark:bg-darkPrimaryBg rounded-lg border border-dashed border-gray-200 dark:border-darkBorder">
                    <p className="text-sm md:text-lg text-subTextColor dark:text-darkTextSecondary">
                        You don&apos;t have any notifications right now.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AllNotification;
