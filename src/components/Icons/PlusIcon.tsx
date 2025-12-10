
const PlusIcon = ({
    size,
    className = "",
}: {
    size: number;
    className?: string;
}) => {
    return (
        <svg width={size} height={size} className={className} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 3L9 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.99805 9L14.998 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

    );
};

export default PlusIcon;