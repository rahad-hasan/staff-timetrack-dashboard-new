const LeaveCalender = ({
    size,
    className = "",
}: {
    size: number;
    className?: string;
}) => {
    return (
        <svg
            width={size}
            height={size}
            className={className}
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                stroke="currentColor"
                d="M10.25 19.75C5.77166 19.75 3.53249 19.75 2.14124 18.3588C0.75 16.9675 0.75 14.7283 0.75 10.25C0.75 5.77166 0.75 3.53249 2.14124 2.14124C3.53249 0.75 5.77166 0.75 10.25 0.75C14.7283 0.75 16.9675 0.75 18.3588 2.14124C19.75 3.53249 19.75 5.77166 19.75 10.25"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                stroke="currentColor"
                d="M0.75 5.75H19.75"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path
                stroke="currentColor"
                d="M8.75 14.75H9.75M4.75 14.75H5.75M8.75 10.75H12.75M4.75 10.75H5.75"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                stroke="currentColor"
                d="M19.15 19.15L20.75 20.75M19.95 16.35C19.95 14.3618 18.3382 12.75 16.35 12.75C14.3618 12.75 12.75 14.3618 12.75 16.35C12.75 18.3382 14.3618 19.95 16.35 19.95C18.3382 19.95 19.95 18.3382 19.95 16.35Z"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default LeaveCalender;