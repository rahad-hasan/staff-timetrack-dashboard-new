import MonthPicker from "@/components/Common/MonthPicker";
import { useState } from "react";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";

const ReportMonthlyTimeSheet = () => {
    console.log("ReportMonthlyTimeSheet");
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
    }
    const calendarData: CalendarDay[] = [
        // Week 1
        { date: 29, time: null }, { date: 30, time: null }, { date: 1, time: '-' }, { date: 2, time: '8h 0m' },
        { date: 3, time: '8h 0m' }, { date: 4, time: '8h 0m' }, { date: 5, time: '8h 0m' },
        // Week 2
        { date: 6, time: '8h 0m' }, { date: 7, time: '8h 0m' }, { date: 8, time: '8h 0m' }, { date: 9, time: null },
        { date: 10, time: null }, { date: 11, time: null }, { date: 12, time: null },
        // Week 3
        { date: 13, time: null }, { date: 14, time: null }, { date: 15, time: null }, { date: 16, time: null },
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
    // month picker
    const [selectedDate, setSelectedDate] = useState(new Date());

    // search user
    const users = [
        {
            value: "Juyed Ahmed",
            label: "Juyed Ahmed",
            avatar: "https://avatar.iran.liara.run/public/18",
        },
        {
            value: "Cameron Williamson",
            label: "Cameron Williamson",
            avatar: "https://avatar.iran.liara.run/public/19",
        },
        {
            value: "Jenny Wilson",
            label: "Jenny Wilson",
            avatar: "https://avatar.iran.liara.run/public/20",
        },
        {
            value: "Esther Howard",
            label: "Esther Howard",
            avatar: "https://avatar.iran.liara.run/public/21",
        },
        {
            value: "Walid Ahmed",
            label: "Walid Ahmed",
            avatar: "https://avatar.iran.liara.run/public/22",
        },
    ]

    return (
        <div className="">
            <div className="mb-5 flex flex-col gap-4 md:gap-0 md:flex-row justify-between">
                <MonthPicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></MonthPicker>
                <SelectUserDropDown users={users}></SelectUserDropDown>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-borderColor dark:border-darkBorder mt-5">
                <table className="w-full border-collapse">
                    <thead className="bg-white dark:bg-darkSecondaryBg">
                        <tr>
                            {days.map((d, i) => (
                                <th
                                    key={i}
                                    className={`
                                        px-4 py-4 text-lg sm:text-xl font-bold dark:text-darkTextPrimary
                                        border-b border-gray-200 dark:border-darkBorder ${i < days.length - 1 ? 'border-r border-gray-200 dark:border-darkBorder' : ''}
                                    `}
                                >
                                    {d.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-darkSecondaryBg">
                        {weeks.map((week, weekIndex) => (
                            <tr key={weekIndex} className="h-20">
                                {week.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={`
                                            ${weekIndex < weeks.length - 1 ? 'border-b border-gray-200 dark:border-darkBorder' : ''} 
                                            ${cellIndex < week.length - 1 ? 'border-r border-gray-200 dark:border-darkBorder' : ''}
                                        `}
                                    >
                                        <div className=" flex flex-col items-center justify-center h-full">
                                            <div className="text-base font-normal dark:text-darkTextPrimary">{cell.date}</div>
                                            {cell.time && (
                                                <div className={`text-md font-medium mt-1  ${cell.time === '-' ? 'text-gray-400 dark:border-darkBorder' : 'text-primary'}`}>
                                                    {cell.time}
                                                </div>
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

export default ReportMonthlyTimeSheet;