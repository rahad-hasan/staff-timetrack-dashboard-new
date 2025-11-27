
const LeaveRequestTableSkeleton = () => {
    const NUMBER_OF_ROWS = 4;
    const skeletonRows = Array.from({ length: NUMBER_OF_ROWS });

    const PlaceholderBlock = ({ className = "h-4 w-full", isRounded = false }) => (
        <div className={`bg-gray-200 dark:bg-gray-700 ${className} ${isRounded ? 'rounded-full' : 'rounded-md'}`}></div>
    );

    const MIN_TABLE_WIDTH = 'min-w-[800px]';
    return (
        <div className="border border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg rounded-lg p-5 animate-pulse max-w-full mt-5">

            <div className="mb-5">
                <PlaceholderBlock className="h-6 w-24" />
            </div>

            <div className="w-full overflow-x-auto">
                <div className={`w-full ${MIN_TABLE_WIDTH}`}>

                    <div className="flex border-b border-gray-200 dark:border-darkBorder py-3 text-sm font-medium text-gray-500 px-1">
                        <div className="w-[20%]">Member name</div>
                        <div className="w-[15%]">From</div>
                        <div className="w-[10%]">To</div>
                        <div className="w-[10%]">Days</div>
                        <div className="w-[20%] ">Reason</div>
                        <div className="w-[10%] ">Available Leave</div>
                        <div className="w-[20%] ">Action</div>
                    </div>

                    <div className="space-y-0">
                        {skeletonRows.map((_, index) => (
                            <div key={index} className="flex items-center border-b border-gray-100 dark:border-darkBorder py-3 last:border-b-0 px-1">

                                <div className="w-[20%] flex items-center gap-2">
                                    <PlaceholderBlock className="w-8 h-8 " isRounded={true} />
                                    <PlaceholderBlock className="h-4 w-3/5" />
                                </div>

                                <div className="w-[15%] flex justify-start">
                                    <PlaceholderBlock className="h-4 w-24 " />
                                </div>

                                <div className="w-[10%] flex justify-start">
                                    <PlaceholderBlock className="h-4 w-8" />
                                </div>

                                <div className="w-[10%]">
                                    <PlaceholderBlock className="h-4 w-8" />
                                </div>

                                <div className="w-[20%] gap-1">
                                    <PlaceholderBlock className="h-4 w-24" />
                                </div>

                                <div className="w-[10%] flex ">
                                    <PlaceholderBlock className="h-4 w-20" />
                                </div>

                                <div className="w-[20%] flex gap-2">
                                    <PlaceholderBlock className="h-8 w-20" />
                                    <PlaceholderBlock className="h-8 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveRequestTableSkeleton;