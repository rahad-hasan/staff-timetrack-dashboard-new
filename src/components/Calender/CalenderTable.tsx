const CalenderTable = () => {
    type DayMeta = { name: string };
    const days: DayMeta[] = [
        { name: 'MON' },
        { name: 'TUE' },
        { name: 'WED' },
        { name: 'THU' },
        { name: 'FRI' },
        { name: 'SAT' },
        { name: 'SUN' },
    ];
    interface CalendarDay {
        date: number;
        time: string | null;
        event?: string[];
    }
    const calendarData: CalendarDay[] = [
        // Week 1
        { date: 29, time: null }, { date: 30, time: null }, { date: 1, time: '-' }, { date: 2, time: '8h 0m' },
        { date: 3, time: '8h 0m' }, { date: 4, time: '8h 0m' }, { date: 5, time: '8h 0m' },
        // Week 2
        { date: 6, time: '8h 0m' }, { date: 7, time: '8h 0m', event: ["Teams Meeting", "TownHall Conference"] }, { date: 8, time: '8h 0m' }, { date: 9, time: null },
        { date: 10, time: null }, { date: 11, time: null }, { date: 12, time: null },
        // Week 3
        { date: 13, time: null, event: ["Teams Meeting", "TownHall Conference", "tradeshows", "product launches", "networking events"] }, { date: 14, time: null }, { date: 15, time: null }, { date: 16, time: null },
        { date: 17, time: null }, { date: 18, time: null }, { date: 19, time: null },
        // Week 4
        { date: 20, time: null }, { date: 21, time: null }, { date: 22, time: null }, { date: 23, time: null },
        { date: 24, time: null }, { date: 25, time: null }, { date: 26, time: null },
        // Week 5
        { date: 27, time: null }, { date: 28, time: null }, { date: 29, time: null }, { date: 30, time: null },
        { date: 31, time: null }, { date: 1, time: null }, { date: 2, time: null },
    ];

    const ROWS_PER_WEEK = 7;


    const chunkArray = (array: CalendarDay[], chunkSize: number) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    };

    const weeks = chunkArray(calendarData, ROWS_PER_WEEK);
    console.log(weeks);

    const pillBaseClasses = 'self-start ml-2 px-3 py-1 text-sm rounded-md font-medium text-center truncate shadow-sm mt-1 cursor-pointer';

    return (
        <div className="">

            <div className="overflow-x-auto rounded-2xl border border-borderColor mt-5">
                <table className="w-full border-collapse">
                    <thead className="bg-white">
                        <tr>
                            {days.map((d, i) => (
                                <th
                                    key={i}
                                    className={`
                                        px-4 py-4 sm:text-xl font-bold
                                        border-b border-gray-200 ${i < days.length - 1 ? 'border-r border-gray-200' : ''}
                                    `}
                                >
                                    {d.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {weeks.map((week, weekIndex) => (
                            <tr key={weekIndex} className="h-26">
                                {week.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={` w-[14.285%]
                                            ${weekIndex < weeks.length - 1 ? 'border-b border-gray-200' : ''} 
                                            ${cellIndex < week.length - 1 ? 'border-r border-gray-200' : ''}
                                        `}
                                    >
                                        <div className=" flex flex-col items-center justify-center h-full">
                                            <div className=" text-sm sm:text-base font-normal mb-1">{cell.date}</div>
                                            {cell.event && (
                                                <>
                                                    {cell.event.length >= 1 && (
                                                        <div className={`${pillBaseClasses} bg-yellow-100 text-sm sm:text-base text-start text-yellow-800 border-l-4 border-yellow-500`}>
                                                            {cell.event[0]}
                                                        </div>
                                                    )}

                                                    {cell.event.length >= 2 && (
                                                        <div className={`${pillBaseClasses} bg-pink-100 text-sm sm:text-base text-start text-pink-800 border-l-4 border-red-500`}>
                                                            {cell.event[1]}
                                                        </div>
                                                    )}

                                                    {cell.event.length > 2 && (
                                                        <div className={`${pillBaseClasses} bg-green-100 text-sm sm:text-base text-start text-green-800 border-l-4 border-green-500`}>
                                                            + {cell.event.length - 2} others
                                                        </div>
                                                    )}
                                                </>
                                            )}
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

export default CalenderTable;