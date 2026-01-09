
const MonthlyTimeSheetsCalendarSkeleton = () => {

    const dayHeaders = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

    const NUM_CALENDAR_CELLS = 35;

    return (
        <div className="">

            <div className=" overflow-auto ">
                <div className="grid grid-cols-7 gap-2 min-w-[750px]">
                    
                    {dayHeaders.map((day, index) => {
                        const isFirst = index === 0 ? "rounded-tl-lg" : "";
                        const isLast = index === dayHeaders.length - 1 ? "rounded-tr-lg" : "";

                        return (
                            <div 
                                key={day} 
                                className={`p-3 flex items-center justify-center font-bold text-sm h-14 bg-gray-100 dark:bg-darkSecondaryBg border-gray-200 animate-pulse ${isFirst} ${isLast}`}
                            >
                                <div className="bg-gray-200 dark:bg-darkPrimaryBg rounded-md h-4 w-10" />
                            </div>
                        );
                    })}
                    
                    {Array.from({ length: NUM_CALENDAR_CELLS }).map((_, dayIndex) => {
                        const isBusy = (dayIndex % 7 !== 5 && dayIndex % 7 !== 6) && (dayIndex % 3 !== 0);

                        return (
                            <div 
                                key={dayIndex} 
                                className={`p-3 h-28 md:h-24 flex flex-col justify-center items-center border border-gray-200 dark:border-darkBorder animate-pulse`}
                            >
                                <div className="bg-gray-200 dark:bg-darkSecondaryBg rounded-full h-6 w-6 mb-3" />
                                {!isBusy && (
                                        <div className="bg-gray-200 dark:bg-darkSecondaryBg rounded-md h-4 w-16" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MonthlyTimeSheetsCalendarSkeleton;
