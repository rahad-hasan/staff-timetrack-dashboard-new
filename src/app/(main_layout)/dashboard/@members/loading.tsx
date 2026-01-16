
const loading = () => {

    const NUMBER_OF_SKELETON_ROWS = 4;
    const skeletonRows = Array.from({ length: NUMBER_OF_SKELETON_ROWS });

    return (
        <div className="border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg w-full h-full animate-pulse p-4 2xl:p-5 rounded-[12px]">
            <div className="flex justify-between items-center">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-gray-200 dark:bg-gray-700 border-none">
                    </div>
                    <div className="h-8 w-26 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                </div>
            </div>
            <div className="flex border-b border-gray-200 dark:border-darkBorder py-3 text-sm font-medium text-gray-500 mt-5">
                <div className="w-[30%] pl-2">Member info</div>
                <div className="w-[30%] text-center">Today</div>
                <div className="w-[40%] text-center">This Week</div>
            </div>
            <div className=" overflow-x-scroll sm:overflow-auto">
                <div className="mt-5 space-y-4">
                    {skeletonRows.map((_, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-darkBorder last:border-b-0">
                            <div className="flex items-center gap-3 w-2/5 min-w-[300px]">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                <div className="flex flex-col gap-1">
                                    <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-3 w-56 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700 rounded"></div>
                                </div>
                            </div>

                            <div className="flex flex-col items-start w-1/5 min-w-[120px]">
                                <div className="h-4 w-10 mb-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>

                            <div className="flex justify-end items-center gap-3 w-2/5">
                                <div className="flex flex-col items-end gap-1">
                                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div className="flex flex-col items-end">
                                        <div className="h-4 w-26 bg-gray-200 dark:bg-gray-700 mb-1 rounded"></div>
                                        <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700 rounded"></div>
                                    </div>
                                </div>
                                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default loading;