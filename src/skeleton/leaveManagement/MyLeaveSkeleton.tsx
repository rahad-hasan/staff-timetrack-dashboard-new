import LeaveBalancesSkeleton from "./LeaveBalancesSkeleton";

const MyLeaveSkeleton = () => {
    const PlaceholderBlock = ({ className = "h-4 w-full", isRounded = false }) => (
        <div className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className} ${isRounded ? 'rounded-full' : 'rounded-md'}`}></div>
    );

    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                    {/* Back Button Placeholder */}
                    <PlaceholderBlock className="h-10 w-24" />
                    {/* Heading & Subheading */}
                    <div className="space-y-2">

                        <PlaceholderBlock className="h-4 w-96 max-w-full" />
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Year Picker & Select User & New Request Buttons */}
                    <PlaceholderBlock className="h-10 w-48" />
                    <PlaceholderBlock className="h-10 w-48" />
                    <PlaceholderBlock className="h-10 w-36" />
                </div>
            </div>

            {/* Grid Layout for Overview and Holidays */}
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
                
                {/* Left Side: Gradient Banner Area */}
                <div className="relative overflow-hidden rounded-[12px] border border-borderColor bg-[linear-gradient(135deg,#ffffff_0%,#fff8f8_50%,#f8fbff_100%)] p-5 dark:border-darkBorder dark:bg-[linear-gradient(135deg,rgba(50,57,71,1)_0%,rgba(33,39,51,1)_100%)]">
                    <div className="relative flex flex-col justify-between h-full space-y-8">
                        
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-4">
                                {/* "Leave Overview" Badge */}
                                <PlaceholderBlock className="h-6 w-32" isRounded />
                                
                                {/* User Name & Email */}
                                <div className="space-y-2">
                                    <PlaceholderBlock className="h-9 w-48" />
                                    <PlaceholderBlock className="h-4 w-40" />
                                </div>
                                
                                {/* Description text */}
                                <PlaceholderBlock className="h-4 w-full max-w-lg" />
                            </div>

                            <div className="flex flex-col gap-3 items-end">
                                {/* Total Allowed Card */}
                                <div className="rounded-[12px] border border-primary/10 bg-white/85 px-5 py-4 w-32 dark:bg-darkPrimaryBg">
                                    <PlaceholderBlock className="h-3 w-20 mb-2 ml-auto" />
                                    <PlaceholderBlock className="h-10 w-12 ml-auto" />
                                </div>
                                {/* Year Badge */}
                                <PlaceholderBlock className="h-9 w-24" isRounded />
                            </div>
                        </div>

                        {/* Bottom Summary Cards (4 blocks) */}
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="rounded-[12px] border border-white bg-white/80 px-4 py-6 shadow-sm dark:border-darkBorder dark:bg-darkPrimaryBg">
                                    <PlaceholderBlock className="h-3 w-24 mb-4" />
                                    <PlaceholderBlock className="h-10 w-16 mb-3" />
                                    <PlaceholderBlock className="h-4 w-32" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Next Holidays Sidebar */}
                <div className="overflow-hidden rounded-[12px] border border-borderColor dark:border-darkBorder dark:bg-darkSecondaryBg">
                    {/* Sidebar Header */}
                    <div className="flex items-center gap-3 border-b border-borderColor px-5 py-4 dark:border-darkBorder">
                        <PlaceholderBlock className="h-11 w-11" isRounded />
                        <div className="space-y-2">
                            <PlaceholderBlock className="h-5 w-32" />
                            <PlaceholderBlock className="h-3 w-48" />
                        </div>
                    </div>

                    {/* Holiday List Items */}
                    <div className="divide-y divide-borderColor dark:divide-darkBorder">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="px-5 py-4 space-y-3">
                                {i === 1 && <PlaceholderBlock className="h-3 w-16" />} {/* "Next Up" tag */}
                                <PlaceholderBlock className="h-5 w-3/4" />
                                <PlaceholderBlock className="h-4 w-1/2" />
                                <PlaceholderBlock className="h-3 w-20" />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
                        <LeaveBalancesSkeleton></LeaveBalancesSkeleton>
        </div>
    );
};

export default MyLeaveSkeleton;