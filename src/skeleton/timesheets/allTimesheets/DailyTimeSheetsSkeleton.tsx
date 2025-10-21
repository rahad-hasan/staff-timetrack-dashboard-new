
const DailyTimeSheetsSkeleton = () => {

    const activePeriods = [
        { start: 5, end: 7, width: 8.33 },
        { start: 13, end: 16, width: 12.5 },
        { start: 18, end: 20, width: 8.33 },
    ];

    return (
        <div className="p-4 rounded-xl  border-2 border-borderColor">
            <div className="mb-5 flex flex-col gap-4 md:gap-0 md:flex-row justify-between">
                <div className="flex flex-col md:flex-row gap-4 md:gap-3">
                    <div className=" flex gap-3">
                        <div className="bg-gray-200 rounded-md animate-pulse w-8  h-10" />
                        <div className="bg-gray-200 rounded-md animate-pulse w-40 md:w-40 h-10" />
                        <div className="bg-gray-200 rounded-md animate-pulse w-8 h-10" />
                    </div>

                    <div className="hidden md:block">
                        <div className="bg-gray-200 rounded-md animate-pulse w-28 h-10" />
                    </div>
                </div>

                <div className="w-full md:w-[250px]">
                    <div className="bg-gray-200 rounded-md animate-pulse w-52 sm:w-full h-10" />
                </div>
            </div>

            <div className="mb-8">
                <div className="flex gap-2 mb-2">
                    <div className="bg-gray-200 rounded-md animate-pulse w-20 h-5" />
                    <div className="bg-gray-200 rounded-md animate-pulse w-24 h-5" />
                </div>

                <div className="relative h-5 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                    {activePeriods.map((period, index) => {
                        const startPercent = (period.start / 24) * 100;
                        const width = period.width;

                        return (
                            <div
                                key={index}
                                className="absolute h-5 bg-gray-300 opacity-60 rounded-full animate-pulse-slow"
                                style={{
                                    left: `${startPercent}%`,
                                    width: `${width}%`,
                                }}
                            ></div>
                        );
                    })}
                </div>

                <div className="flex justify-between mt-1 text-xs">
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
            <div className="space-y-2  w-full overflow-x-auto">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center w-full p-3  border-b border-gray-100 bg-white">
                        <div className="bg-gray-200 rounded-md animate-pulse h-6 min-w-[200px] md:w-4/12" />
                        <div className="flex items-center justify-center min-w-[180px] md:w-2/12">
                            <div className="bg-gray-200 rounded-md animate-pulse h-6 w-12" />
                        </div>
                        <div className="flex items-center justify-center min-w-[180px] md:w-2/12">
                            <div className="bg-gray-200 rounded-md animate-pulse h-6 w-12" />
                        </div>
                        <div className="bg-gray-200 rounded-md animate-pulse h-6 min-w-[180px] md:w-2/12" />
                        <div className=" flex items-center justify-end min-w-[180px] md:w-2/12">
                            <div className="bg-gray-200 rounded-md animate-pulse h-10 w-8 " />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DailyTimeSheetsSkeleton;
