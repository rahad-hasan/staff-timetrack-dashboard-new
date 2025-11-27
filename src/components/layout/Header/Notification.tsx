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
import { useState } from "react";

const notifications = [
    {
        id: 1,
        type: 'project',
        title: 'Project Alpha deadline moved to next Friday.',
        time: '3 hours ago',
        image: 'https://picsum.photos/48/48?random=1',
        isNew: true,
    },
    {
        id: 2,
        type: 'user',
        title: 'John Doe commented on your pull request.',
        time: '5 minutes ago',
        image: 'https://avatar.iran.liara.run/public/20',
        isNew: true,
    },
    {
        id: 3,
        type: 'general',
        title: 'Server downtime alert: Emergency maintenance underway.',
        time: '1 minute ago',
        image: 'https://picsum.photos/48/48?random=2',
        isNew: true,
    },
    {
        id: 4,
        type: 'project',
        title: 'Client approval received for design mockups.',
        time: '1 day ago',
        image: 'https://picsum.photos/48/48?random=3',
        isNew: false,
    },
    {
        id: 5,
        type: 'user',
        title: 'You were mentioned in a task description by Jane Smith.',
        time: '2 hours ago',
        image: 'https://avatar.iran.liara.run/public/45',
        isNew: false,
    },
    {
        id: 6,
        type: 'general',
        title: 'New feature deployed: Dark mode is now available!',
        time: '4 hours ago',
        image: 'https://picsum.photos/48/48?random=4',
        isNew: true,
    }
];

const getNotificationStyles = (type: any) => {
    switch (type) {
        case 'user':
            return {
                icon: '👤',
                color: 'text-blue-600 bg-blue-50/50',
                imageStyle: 'rounded-full'
            };
        case 'project':
            return {
                icon: '🏗️',
                color: 'text-green-600 bg-green-50/50',
                imageStyle: 'rounded-md'
            };
        case 'general':
            return {
                icon: '📢',
                color: 'text-yellow-600 bg-yellow-50/50',
                imageStyle: 'rounded-md'
            };
        default:
            return {
                icon: '🔔',
                color: 'text-gray-600 bg-gray-50/50',
                imageStyle: 'rounded-md'
            };
    }
};

const Notification = () => {
    const [open, setOpen] = useState(false);
    const unreadCount = notifications.filter(n => n.isNew).length;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="relative w-[25px] h-[25px] cursor-pointer">
                    <Image
                        src={bellIcon}
                        fill
                        className="object-contain bell-icon"
                        alt="notification bell"
                    />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1.5 w-4 h-4 text-[10px] font-bold text-white bg-red-600 rounded-full flex items-center justify-center border border-white dark:border-red-600">
                            {unreadCount}
                        </span>
                    )}

                </div>
            </PopoverTrigger>
            <PopoverContent side={'top'} align={'center'} className="w-80 sm:w-[400px] p-0 shadow-lg mt-2">
                <div className="p-4">
                    <h2 className="text-lg font-medium  text-headingTextColor dark:text-darkTextPrimary">
                        Notifications {unreadCount > 0 && <span>({unreadCount} new)</span>}
                    </h2>
                </div>

                <div className="max-h-86 overflow-y-auto">
                    {notifications.map(notification => {
                        const styles = getNotificationStyles(notification.type);
                        return (
                            <div
                                key={notification.id}
                                className={`flex items-center gap-3 px-3 py-2 border-b transition-colors text-headingTextColor dark:bg-darkSecondaryBg ${notification.isNew ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-100'}`}
                            >
                                <Image
                                    src={notification.image}
                                    width={48}
                                    height={48}
                                    className={`w-12 h-12 object-cover ${styles.imageStyle}`}
                                    alt="image"
                                />

                                <div className="flex-grow">
                                    <h3 className={`text-sm font-medium text-headingTextColor dark:text-darkTextPrimary ${notification.isNew ? 'text-headingTextColor' : 'text-subTextColor'}`}>
                                        {notification.title}
                                    </h3>
                                    <p className="text-xs text-subTextColor dark:text-darkTextSecondary mt-0.5">
                                        {notification.time}
                                        {notification.isNew && (
                                            <span className="ml-2 inline-block w-1.5 h-1.5 bg-red-500 rounded-full align-middle" aria-label="New notification"></span>
                                        )}
                                    </p>
                                </div>

                            </div>
                        );
                    })}
                </div>

                <div className="p-2 flex justify-between items-center text-sm">
                    <Link href={`/notification`}>
                        <button onClick={() => setOpen(false)} className="text-primary font-medium px-2 py-1 rounded cursor-pointer">
                            View All
                        </button>
                    </Link>

                    {unreadCount > 0 && (
                        <button className="text-subTextColor dark:text-gray-300 text-xs px-2 py-1 rounded cursor-pointer">
                            Mark All as Read
                        </button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default Notification;