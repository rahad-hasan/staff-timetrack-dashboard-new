
const CollapsedIcon = ({size}: {size: number}) => {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 3.33203V16.6654" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17.5 3.33203V16.6654" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.0178 7.5L13.75 8.23223C14.5833 9.06558 15 9.48225 15 10C15 10.5177 14.5833 10.9344 13.75 11.7677L13.0178 12.5M6.98223 7.5L6.25 8.23223C5.41667 9.06558 5 9.48225 5 10C5 10.5177 5.41667 10.9344 6.25 11.7677L6.98223 12.5M5.31557 10H14.6845" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

    );
};

export default CollapsedIcon;