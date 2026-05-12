const VideoIcon = ({
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
            viewBox="0 0 21 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.7468 11.2882C14.8277 13.1203 13.3491 14.6695 11.4446 14.7474C11.3043 14.7533 4.46526 14.7395 4.46526 14.7395C2.56991 14.8834 0.9111 13.5214 0.761602 11.6963C0.750339 11.5603 0.753411 4.22213 0.753411 4.22213C0.669446 2.38809 2.14599 0.834927 4.05158 0.754115C4.19391 0.747217 11.0237 0.760028 11.0237 0.760028C12.9283 0.618115 14.5922 1.98995 14.7397 3.82398C14.75 3.95604 14.7468 11.2882 14.7468 11.2882Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14.75 5.72978L18.043 3.03478C18.859 2.36678 20.083 2.94878 20.082 4.00178L20.07 11.3508C20.069 12.4038 18.844 12.9808 18.03 12.3128L14.75 9.61778"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default VideoIcon;