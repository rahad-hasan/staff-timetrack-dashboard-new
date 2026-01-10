/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import MonthPicker from "@/components/Common/MonthPicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";

interface TimeData {
    date: string;
    duration: string;
    activity: number;
    active_time: string;
    idle_time: string;
}

const ReportMonthlyTimeSheet = ({ data }: { data: TimeData[] }) => {
    const days = [
        { name: 'MON' }, { name: 'TUE' }, { name: 'WED' },
        { name: 'THU' }, { name: 'FRI' }, { name: 'SAT' }, { name: 'SUN' },
    ];

    const formatDuration = (duration: string) => {
        const [hours, minutes] = duration.split(':').map(Number);
        if (hours === 0 && minutes === 0) return "";
        return `${hours}h ${minutes}m`;
    };

    const generateCalendar = () => {
        if (!data || data.length === 0) return [];

        const calendarCells = [];
        const firstDate = new Date(data[0].date);
        const lastDate = new Date(data[data.length - 1].date);

        // 1. Calculate Padding for PREVIOUS month
        const startDay = firstDate.getDay();
        console.log('firstDate', firstDate);
        console.log('startDay', startDay);
        const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

        for (let i = adjustedStartDay; i > 0; i--) {
            const prevDate = new Date(firstDate);
            prevDate.setDate(firstDate.getDate() - i);
            calendarCells.push({ 
                date: prevDate.getDate(), 
                time: null, 
                isPadding: true 
            });
        }

        // 2. Add Current Month Data
        data.forEach((item) => {
            const dateObj = new Date(item.date);
            calendarCells.push({
                date: dateObj.getDate(),
                time: formatDuration(item.duration),
                isPadding: false
            });
        });

        // 3. Calculate Padding for NEXT month
        let nextDateCounter = 1;
        while (calendarCells.length % 7 !== 0) {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + nextDateCounter);
            calendarCells.push({ 
                date: nextDate.getDate(), 
                time: null, 
                isPadding: true 
            });
            nextDateCounter++;
        }

        return calendarCells;
    };

    const calendarData = generateCalendar();

    console.log("calendar Data", calendarData);

    const chunkArray = (array: any[], chunkSize: number) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    };

    const weeks = chunkArray(calendarData, 7);

    console.log("weeks", weeks);

    return (
        <div className="">
            <div className="mb-5 flex flex-col gap-4 md:gap-0 md:flex-row justify-between">
                <MonthPicker />
                <SelectUserDropDown />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-borderColor dark:border-darkBorder mt-5">
                <table className="w-full border-collapse">
                    <thead className="bg-bgPrimary dark:bg-darkSecondaryBg">
                        <tr>
                            {days.map((d, i) => (
                                <th
                                    key={i}
                                    className={`px-4 py-4 text-lg sm:text-xl font-bold text-headingTextColor dark:text-darkTextPrimary border-b border-gray-200 dark:border-darkBorder ${i < days.length - 1 ? 'border-r' : ''}`}
                                >
                                    {d.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-bgPrimary dark:bg-darkSecondaryBg">
                        {weeks.map((week, weekIndex) => (
                            <tr key={weekIndex} className="h-24">
                                {week.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={`p-2 border-gray-200 dark:border-darkBorder ${weekIndex < weeks.length - 1 ? 'border-b' : ''} ${cellIndex < 6 ? 'border-r' : ''}`}
                                    >
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <div className={`text-base font-normal ${cell.isPadding ? 'text-gray-400 dark:text-gray-600' : 'text-headingTextColor dark:text-darkTextPrimary'}`}>
                                                {cell.date}
                                            </div>
                                            {!cell.isPadding && cell.time && (
                                                <div className="text-base font-medium mt-1 text-primary">
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