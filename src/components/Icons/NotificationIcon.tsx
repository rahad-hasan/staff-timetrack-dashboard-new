
const NotificationIcon = ({ size }: { size: number }) => {
    return (
        <svg width={size } height={size } viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M7.125 11.3151C11.3544 11.3151 13.311 10.8328 13.5 8.897C13.5 6.96253 12.1359 7.08693 12.1359 4.71341C12.1359 2.85943 10.1589 0.75 7.125 0.75C4.09108 0.75 2.11414 2.85943 2.11414 4.71341C2.11414 7.08693 0.75 6.96253 0.75 8.897C0.939714 10.8401 2.89633 11.3151 7.125 11.3151Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.91567 13.3203C7.89257 14.3301 6.29656 14.3421 5.26367 13.3203" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

    );
};

export default NotificationIcon;