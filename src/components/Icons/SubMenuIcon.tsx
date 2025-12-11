
const SubMenuIcon = ({ size }: { size: number }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 6 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" width="2" height="18" rx="1" fill="currentColor" />
            <rect x="2" width="2" height="18" rx="1" fill="url(#paint0_linear_14405_73663)" fillOpacity="0.16" />
            <circle cx="3" cy="9" r="3" fill="currentColor" />
            <circle cx="3" cy="9" r="3" fill="url(#paint1_linear_14405_73663)" fillOpacity="0.16" />
            <defs>
                <linearGradient id="paint0_linear_14405_73663" x1="3" y1="0" x2="3" y2="18" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="paint1_linear_14405_73663" x1="3" y1="6" x2="3" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default SubMenuIcon;