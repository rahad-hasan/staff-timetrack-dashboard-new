
const DailyTimeSheetsSkeleton = () => {

    const activePeriods = [
        { start: 5, end: 7, width: 8.33 },
        { start: 13, end: 16, width: 12.5 },
        { start: 18, end: 20, width: 8.33 },
    ];

    return (
        <div className="">

            <div className="mb-5">
                <div className="flex gap-2">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse w-20 h-5" />
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse w-24 h-5" />
                </div>

                <div className="relative h-5 bg-gray-100 rounded-full border border-gray-200 dark:border-darkBorder dark:bg-gray-700 overflow-hidden mt-3">
                    {activePeriods.map((period, index) => {
                        const startPercent = (period.start / 24) * 100;
                        const width = period.width;

                        return (
                            <div
                                key={index}
                                className="absolute h-5 bg-gray-300 dark:bg-darkPrimaryBg opacity-60 rounded-full animate-pulse-slow"
                                style={{
                                    left: `${startPercent}%`,
                                    width: `${width}%`,
                                }}
                            ></div>
                        );
                    })}
                </div>

                <div className="flex justify-between text-xs mt-1">
                    {Array.from({ length: 24 }, (_, i) => {
                        const hour = i + 1;
                        const isAlwaysVisible = hour === 1 || hour === 6 || hour === 12 || hour === 18 || hour === 24;

                        return (
                            <span
                                key={i}
                                className={`text-gray-400 animate-pulse opacity-50 ${!isAlwaysVisible ? "hidden lg:inline xl:inline" : ""}`}
                            >
                                {hour}h
                            </span>
                        );
                    })}
                </div>
            </div>
            <div className="w-full overflow-x-auto p-4 rounded-xl border-2 border-borderColor dark:border-darkBorder">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center w-full border-b border-gray-100 dark:border-darkBorder py-2">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse h-6 min-w-[200px] md:w-4/12" />
                        <div className="flex items-center justify-center min-w-[180px] md:w-2/12">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse h-6 w-12" />
                        </div>
                        <div className="flex items-center justify-center min-w-[180px] md:w-2/12">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse h-6 w-12" />
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse h-6 min-w-[180px] md:w-2/12" />
                        <div className=" flex items-center justify-end min-w-[180px] md:w-2/12">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse h-10 w-8 " />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DailyTimeSheetsSkeleton;
