
const AttendanceTableSkeleton = () => {
    const NUMBER_OF_ROWS = 4;
    const skeletonRows = Array.from({ length: NUMBER_OF_ROWS });

    const PlaceholderBlock = ({ className = "h-4 w-full", isRounded = false }) => (
        <div className={`bg-gray-200 dark:bg-gray-700 ${className} ${isRounded ? 'rounded-full' : 'rounded'}`}></div>
    );

    const MIN_TABLE_WIDTH = 'min-w-[600px]';

    return (

        <>
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 animate-pulse`}>
                <div className=" flex items-center gap-2">
                    <div className={`h-8 md:h-10 w-10 md:w-10 rounded-md bg-gray-200 dark:bg-gray-700`} />
                    <div className={`h-8 md:h-10 w-32 md:w-48 rounded-md bg-gray-200 dark:bg-gray-700`} />
                    <div className={`h-8 md:h-10 w-10 md:w-10 rounded-md bg-gray-200 dark:bg-gray-700`} />
                </div>
                <div className={`grid grid-cols-3 mt-3 w-[250px] lg:w-[280px] sm:mt-0 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 opacity-50`}>
                    <div className="h-full w-full border-white/20 dark:border-gray-600" />
                </div>
            </div>
            <div className="mt-5 border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px] animate-pulse max-w-full">
                <div className="mb-5">
                    <PlaceholderBlock className="h-6 w-32" />
                </div>

                <div className="w-full overflow-x-auto">
                    <div className={`w-full ${MIN_TABLE_WIDTH}`}>
                        <div className="flex border-b border-gray-200 dark:border-darkBorder py-3 text-sm font-medium text-gray-500">
                            <div className="w-[30%] ">Member Name</div>
                            <div className="w-[15%] ">Date</div>
                            <div className="w-[10%] text-center">Status</div>
                            <div className="w-[10%] text-center">App Version</div>
                            <div className="w-[15%] text-center">Check In</div>
                            <div className="w-[15%] text-center">Check Out</div>
                        </div>

                        <div className="space-y-2">
                            {skeletonRows.map((_, index) => (
                                <div key={index} className="flex items-center border-b border-gray-100 dark:border-gray-800 py-3 last:border-b-0">

                                    <div className="w-[30%] flex items-center gap-2">
                                        <PlaceholderBlock className="w-9 h-9 rounded-full bg-gray-300" />
                                        <PlaceholderBlock className="h-4 w-28" />
                                    </div>

                                    <div className="w-[15%] flex gap-1 ">
                                        <PlaceholderBlock className="h-4 w-6/12" />

                                    </div>

                                    <div className="w-[10%] flex justify-center">
                                        <PlaceholderBlock className="h-4 w-16" />
                                    </div>

                                    <div className="w-[10%] flex justify-center">
                                        <PlaceholderBlock className="h-4 w-16" />
                                    </div>
                                    <div className="w-[15%] flex justify-center">
                                        <PlaceholderBlock className="h-4 w-16" />
                                    </div>

                                    <div className="w-[15%] flex justify-center">
                                        <PlaceholderBlock className="h-4 w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AttendanceTableSkeleton;