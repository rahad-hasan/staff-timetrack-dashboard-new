
const leaveDetailsSkeleton = () => {
    const PlaceholderBox = ({ className = "h-4 w-full" }) => (
        <div className={`bg-gray-200 dark:bg-gray-700 ${className} rounded-md`}></div>
    );
    const skeletonCards = Array.from({ length: 4 });

    const NUMBER_OF_ROWS = 4;
    const skeletonRows = Array.from({ length: NUMBER_OF_ROWS });

    const PlaceholderBlock = ({ className = "h-4 w-full", isRounded = false }) => (
        <div className={`bg-gray-200 dark:bg-gray-700 ${className} ${isRounded ? 'rounded-full' : 'rounded-md'}`}></div>
    );

    const MIN_TABLE_WIDTH = 'min-w-[800px]';
    return (
        <div>
            <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 w-full 2xl:w-[70%] animate-pulse">
                {skeletonCards.map((_, index) => (
                    <div key={index} className="border border-gray-200 dark:border-darkBorder rounded-xl w-full overflow-hidden">
                        <div className="py-7 sm:py-10 flex justify-center items-center border-b border-gray-200 dark:border-darkBorder rounded-t-xl">
                            <PlaceholderBox className="h-8 w-12 bg-gray-300" />
                        </div>
                        <div className="text-sm sm:text-base text-center py-3 px-2">
                            <PlaceholderBox className="h-4 w-4/5 mx-auto" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-2 border-borderColor dark:border-darkBorder rounded-lg p-5 animate-pulse max-w-full mt-5">

                <div className="mb-5">
                    <PlaceholderBlock className="h-6 w-24" />
                </div>

                <div className="w-full overflow-x-auto">
                    <div className={`w-full ${MIN_TABLE_WIDTH}`}>

                        <div className="flex border-b border-gray-200 dark:border-darkBorder py-3 text-sm font-semibold text-gray-500 px-1">
                            <div className="w-[25%]">Member name</div>
                            <div className="w-[15%]">Total Leave</div>
                            <div className="w-[15%]">Casual Leave</div>
                            <div className="w-[20%]">Sick Leave</div>
                            <div className="w-[10%] ">Paid Leave</div>
                            <div className="w-[10%] ">Available Leave</div>
                        </div>

                        <div className="space-y-0">
                            {skeletonRows.map((_, index) => (
                                <div key={index} className="flex items-center border-b border-gray-100 dark:border-darkBorder py-3 last:border-b-0 px-1">

                                    <div className="w-[25%] flex items-center gap-2">
                                        <PlaceholderBlock className="w-8 h-8" isRounded={true} />
                                        <PlaceholderBlock className="h-4 w-3/5" />
                                    </div>

                                    <div className="w-[15%] flex justify-start">
                                        <PlaceholderBlock className="h-4 w-8 rounded-full" />
                                    </div>

                                    <div className="w-[15%] flex justify-start">
                                        <PlaceholderBlock className="h-4 w-8" />
                                    </div>

                                    <div className="w-[20%]">
                                        <PlaceholderBlock className="h-4 w-8" />
                                    </div>

                                    <div className="w-[10%] gap-1">
                                        <PlaceholderBlock className="h-4 w-8" />
                                    </div>

                                    <div className="w-[10%] flex ">
                                        <PlaceholderBlock className="h-4 w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default leaveDetailsSkeleton;