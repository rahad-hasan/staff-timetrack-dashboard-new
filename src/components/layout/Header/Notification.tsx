"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import bellIcon from '../../../assets/header/bell.svg'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import Link from "next/link";
import { useState, useRef } from "react"; // Added useRef
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { readNotifications } from "@/actions/notification/action";
import { toast } from "sonner";
import { INotificationItem } from "@/types/type";

const Notification = ({ unreadCount, notificationsList }: any) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    async function onSubmit() {
        if (!scrollContainerRef.current || !notificationsList) return;

        setLoading(true);
        try {
            const container = scrollContainerRef.current;
            const containerTop = container.scrollTop;
            const containerBottom = containerTop + container.clientHeight;

            const children = Array.from(container.children) as HTMLElement[];

            const visibleIds = notificationsList
                .filter((_: any, index: number) => {
                    const child = children[index];
                    if (!child) return false;

                    const childTop = child.offsetTop;
                    const childBottom = childTop + child.offsetHeight;

                    // Check if the item is partially or fully visible in the viewport
                    return childBottom > containerTop && childTop < containerBottom;
                })
                .map((item: INotificationItem) => item.id);

            if (visibleIds.length === 0) {
                toast.info("No visible unread notifications to mark.");
                return;
            }

            const res = await readNotifications({ data: { ids: visibleIds } });

            if (res?.success) {
                toast.success(res?.message || "Notifications marked as read");
            } else {
                toast.error(res?.message || "Failed to update notifications");
            }
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="relative w-[25px] h-[25px] cursor-pointer">
                    <Image src={bellIcon} fill className="object-contain bell-icon" alt="notification bell" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1.5 w-4 h-4 text-[9px] font-bold text-white bg-red-600 rounded-full flex items-center justify-center border border-white dark:border-red-600">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent side={'top'} align={'center'} className="w-80 sm:w-[400px] p-0 shadow-lg mt-2 dark:border-darkBorder">
                <div className="p-4">
                    <h2 className="text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
                        Notifications {unreadCount > 0 && <span>({unreadCount} new)</span>}
                    </h2>
                </div>

                {notificationsList?.length ? (
                    <div>
                        {/* 3. Attach the ref to the scrollable div */}
                        <div
                            ref={scrollContainerRef}
                            className="max-h-86 overflow-y-auto relative" // Changed to max-h-80 (standard tailwind) or keep your custom h-86
                        >
                            {notificationsList?.map((notification: INotificationItem) => (
                                <div
                                    key={notification?.id}
                                    className={`flex items-center gap-3 px-4.5 py-2.5 border-b dark:border-darkBorder transition-colors text-headingTextColor dark:bg-darkSecondaryBg ${!notification.is_read ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-100'}`}
                                >
                                    <div className="flex-grow">
                                        <h3 className={`text-sm font-medium text-headingTextColor dark:text-darkTextPrimary ${notification?.is_read ? 'text-headingTextColor' : 'text-subTextColor'}`}>
                                            {notification?.message}
                                        </h3>
                                        <div className="text-xs text-subTextColor dark:text-darkTextSecondary mt-0.5 flex items-center">
                                            <p>
                                                <span className="font-medium mr-1">
                                                    {formatDistanceToNow(parseISO(notification?.data?.date), { addSuffix: true })},
                                                </span>
                                                {format(parseISO(notification?.data?.date), 'MMM d, yyyy')}
                                            </p>
                                            {!notification?.is_read && (
                                                <span className="ml-2 inline-block w-1.5 h-1.5 bg-red-500 rounded-full align-middle"></span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-2 flex justify-between items-center text-sm">
                            <Link href={`/notification`}>
                                <button onClick={() => setOpen(false)} className="text-primary font-medium px-2 py-1 rounded cursor-pointer">
                                    View All
                                </button>
                            </Link>

                            {unreadCount > 0 && (
                                <button onClick={onSubmit} disabled={loading} className="text-subTextColor dark:text-gray-300 text-xs px-2 py-1 rounded cursor-pointer">
                                    {loading ? 'Processing...' : 'Mark Visible as Read'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="px-4 pb-2">
                        <div className="mb-2">
                            <p className="text-sm">No Unread Notification Available</p>
                        </div>
                        <Link href={`/notification`}>
                            <button onClick={() => setOpen(false)} className="text-primary font-medium py-1 rounded cursor-pointer">
                                View All
                            </button>
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default Notification;