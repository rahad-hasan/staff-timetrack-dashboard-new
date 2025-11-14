"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
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
    },
    {
        id: 7,
        type: 'project',
        title: 'New task assigned to you: Implement homepage design.',
        time: '1 hour ago',
        image: 'https://picsum.photos/48/48?random=5',
        isNew: true,
    },
    {
        id: 8,
        type: 'user',
        title: 'Sarah Connor approved your code review.',
        time: 'Yesterday',
        image: 'https://avatar.iran.liara.run/public/33',
        isNew: false,
    },
    {
        id: 9,
        type: 'general',
        title: 'System update scheduled for 2 AM tomorrow.',
        time: '2 days ago',
        image: 'https://picsum.photos/48/48?random=6',
        isNew: false,
    },
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


const NotificationItem = ({ notification }: { notification: (typeof notifications)[0] }) => {
    const styles = getNotificationStyles(notification.type);

    return (
        <div
            key={notification.id}
            className={`flex items-start gap-4 py-3 border-b dark:border-darkBorder transition-colors `}
        >
            <div className="flex-shrink-0">
                <Image
                    src={notification.image}
                    width={48}
                    height={48}
                    className={`w-12 h-12 object-cover ${styles.imageStyle}`}
                    alt={`${notification.type} image`}
                />
            </div>

            <div className="flex-grow min-w-0">
                <p className={` text-sm sm:text-base font-medium ${notification.isNew ? 'text-headingTextColor dark:text-darkTextPrimary' : 'text-subTextColor dark:text-darkTextSecondary'}`}>
                    {notification.title}
                </p>

                <div className="flex items-center mt-1 text-xs text-subTextColor dark:text-darkTextSecondary">
                    <span>{notification.time}</span>
                    {notification.isNew && (
                        <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full align-middle" aria-label="New notification"></span>
                    )}
                    <span className={`ml-4 text-[10px] font-semibold px-2 py-0.5 rounded-full dark:bg-darkPrimaryBg capitalize ${styles.color}`}>
                        {styles.icon} {notification.type}
                    </span>
                </div>
            </div>
            <div className="flex-shrink-0 self-center">
                <button className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hidden group-hover:block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

const NotificationPage = () => {

    return (
        <div className="">
            <div className=" flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">Notifications</h2>
                <button
                    className="text-sm font-medium text-subTextColor dark:text-darkTextSecondary transition-colors rounded-md"
                >
                    Mark All as Read
                </button>
            </div>

            {notifications.length > 0 && (
                <section className="mb-8">
                    <div className=" rounded-lg overflow-hidden">
                        {notifications.map(notification => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))}
                    </div>
                </section>
            )}

            {notifications.length === 0 && (
                <div className="text-center py-12 bg-gray-50 dark:bg-darkPrimaryBg rounded-lg">
                    <p className="text-lg text-subTextColor dark:text-darkTextSecondary">🎉 You&apos;re all caught up! No new notifications.</p>
                </div>
            )}
        </div>
    );
};

export default NotificationPage;