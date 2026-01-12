const ReportMonthlyTimesheetSkeleton = () => {
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const skeletonWeeks = Array(5).fill(null); 
    const skeletonDays = Array(7).fill(null);

    return (
        <div className="animate-pulse">
            {/* Calendar Table Skeleton */}
            <div className="overflow-x-auto rounded-2xl border border-borderColor dark:border-darkBorder mt-5">
                <table className="w-full border-collapse">
                    <thead className="bg-bgPrimary dark:bg-darkSecondaryBg">
                        <tr>
                            {days.map((day, i) => (
                                <th
                                    key={i}
                                    className={`px-4 py-4 border-b border-gray-200 dark:border-darkBorder ${
                                        i < days.length - 1 ? "border-r" : ""
                                    }`}
                                >
                                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-bgPrimary dark:bg-darkSecondaryBg">
                        {skeletonWeeks.map((_, weekIndex) => (
                            <tr key={weekIndex} className="h-24">
                                {skeletonDays.map((_, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={`p-2 border-gray-200 dark:border-darkBorder ${
                                            weekIndex < skeletonWeeks.length - 1 ? "border-b" : ""
                                        } ${cellIndex < 6 ? "border-r" : ""}`}
                                    >
                                        <div className="flex flex-col items-center justify-center h-full gap-2">
                                            {/* Date Number Skeleton */}
                                            <div className="h-4 w-6 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                            {/* Time Label Skeleton */}
                                            <div className="h-4 w-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg"></div>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportMonthlyTimesheetSkeleton;