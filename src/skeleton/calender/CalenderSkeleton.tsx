const CalenderSkeleton = () => {
    const skeletonWeeks = Array.from({ length: 4 });
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    return (
        <div className="overflow-x-auto rounded-2xl border border-borderColor dark:border-darkBorder mt-5 animate-pulse">
            <table className="w-full border-collapse">
                <thead className="bg-white dark:bg-darkSecondaryBg">
                    <tr>
                        {days.map((day, i) => (
                            <th
                                key={i}
                                className={`px-4 py-4 sm:text-xl font-bold text-headingTextColor/10 dark:text-darkTextPrimary/10 border-b border-gray-200 dark:border-darkBorder ${
                                    i < days.length - 1 ? 'border-r border-gray-200 dark:border-darkBorder' : ''
                                }`}
                            >
                                {day}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-darkSecondaryBg">
                    {skeletonWeeks.map((_, weekIndex) => (
                        <tr key={weekIndex} className="h-26">
                            {days.map((_, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    className={`w-[14.285%] p-0 vertical-top
                                        ${weekIndex < skeletonWeeks.length - 1 ? 'border-b border-gray-200 dark:border-darkBorder' : ''} 
                                        ${cellIndex < days.length - 1 ? 'border-r border-gray-200 dark:border-darkBorder' : ''}
                                    `}
                                >
                                    <div className="flex flex-col items-center h-full pb-3 pt-2">
                                        {/* Date number: very faint */}
                                        <div className="h-4 w-5 bg-gray-100 dark:bg-darkBorder rounded mb-4" />
                                        
                                        <div className="w-full flex flex-col px-3 items-start">
                                            {/* Logic: Only show 1 event on most days, and leave some days empty */}
                                            {(weekIndex + cellIndex) % 4 !== 0 ? (
                                                <div className="h-7 w-[85%] bg-gray-100 dark:bg-darkBorder/40 rounded-md" />
                                            ) : (
                                                /* Empty state height placeholder to prevent collapse */
                                                <div className="h-7 w-0" />
                                            )}
                                        </div>
                                    </div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CalenderSkeleton;