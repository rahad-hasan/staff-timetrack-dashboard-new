const LeaveBalancesSkeleton = () => {
    const NUMBER_OF_CARDS = 4;
    const skeletonCards = Array.from({ length: NUMBER_OF_CARDS });

    const PlaceholderBlock = ({ className = "h-4 w-full", isRounded = false }) => (
        <div className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className} ${isRounded ? 'rounded-full' : 'rounded-md'}`}></div>
    );

    return (
        <div className="space-y-3">
            {/* Section Header */}
            <div>
                <PlaceholderBlock className="h-7 w-40 mb-2" />
                <PlaceholderBlock className="h-4 w-80" />
            </div>

            {/* Grid for Balance Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {skeletonCards.map((_, index) => (
                    <div
                        key={index}
                        className="rounded-[12px] border border-borderColor p-4 dark:border-darkBorder dark:bg-darkSecondaryBg"
                    >
                        {/* Card Header: Title & Left Balance */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <PlaceholderBlock className="h-3 w-3" isRounded />
                                    <PlaceholderBlock className="h-6 w-3/4" />
                                </div>
                                <div className="mt-3">
                                    <PlaceholderBlock className="h-6 w-24" isRounded />
                                </div>
                            </div>

                            {/* "Left" Numeric Display */}
                            <div className="rounded-2xl bg-bgSecondary px-4 py-3 dark:bg-darkPrimaryBg w-20 flex flex-col items-end">
                                <PlaceholderBlock className="h-2 w-8 mb-2" />
                                <PlaceholderBlock className="h-7 w-10" />
                            </div>
                        </div>

                        {/* Detailed Stats Section */}
                        <div className="mt-4 space-y-3">
                            {/* Min notice & Back-dated rows */}
                            <div className="flex items-center justify-between rounded-2xl bg-bgSecondary px-3 py-3 dark:bg-darkPrimaryBg">
                                <PlaceholderBlock className="h-4 w-20" />
                                <PlaceholderBlock className="h-4 w-12" />
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-bgSecondary px-3 py-3 dark:bg-darkPrimaryBg">
                                <PlaceholderBlock className="h-4 w-20" />
                                <PlaceholderBlock className="h-4 w-16" />
                            </div>

                            {/* Attachment & Used Small Grid */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-bgSecondary px-3 py-3 dark:bg-darkPrimaryBg">
                                    <PlaceholderBlock className="h-2 w-16 mb-2" />
                                    <PlaceholderBlock className="h-4 w-14" />
                                </div>
                                <div className="rounded-2xl bg-bgSecondary px-3 py-3 dark:bg-darkPrimaryBg">
                                    <PlaceholderBlock className="h-2 w-12 mb-2" />
                                    <PlaceholderBlock className="h-4 w-20" />
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar Area */}
                        <div className="mt-4">
                            <PlaceholderBlock className="h-2 w-full" isRounded />
                            <div className="mt-2 flex items-center justify-between">
                                <PlaceholderBlock className="h-3 w-12" />
                                <PlaceholderBlock className="h-3 w-16" />
                            </div>
                        </div>

                        {/* Action Button Placeholder */}
                        <PlaceholderBlock className="mt-4 h-10 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeaveBalancesSkeleton;