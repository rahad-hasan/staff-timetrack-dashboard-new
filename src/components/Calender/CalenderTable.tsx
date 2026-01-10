/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Dialog, DialogTrigger } from "../ui/dialog";
import EditEventModal from "./EditEventModal";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

// Helper to format date for matching
const formatToISODate = (date: Date) => date?.toISOString().split('T')[0];

const CalenderTable = ({ startMonth, endMonth, eventData }: { startMonth: string | number | string[] | undefined, endMonth: string | number | string[] | undefined, eventData: any }) => {
    const days = [
        { name: 'MON' }, { name: 'TUE' }, { name: 'WED' },
        { name: 'THU' }, { name: 'FRI' }, { name: 'SAT' }, { name: 'SUN' }
    ];

    // 1. Dynamic logic preserved
    const generateCalendar = () => {
        const start = new Date(startMonth as string);
        const end = new Date(endMonth as string);
        const firstDayOfMonth = start.getDay();
        const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        const calendarGrid = [];
        const displayStart = new Date(start);
        displayStart.setDate(start.getDate() - paddingDays);

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(displayStart);
            currentDate.setDate(displayStart.getDate() + i);
            const dateString = formatToISODate(currentDate);

            const dayEvents = eventData.filter(event =>
                formatToISODate(new Date(event.date)) === dateString
            );

            calendarGrid.push({
                fullDate: dateString,
                date: currentDate.getDate(),
                isCurrentMonth: currentDate.getMonth() === start.getMonth(),
                events: dayEvents
            });

            if (currentDate > end && calendarGrid.length % 7 === 0) break;
        }
        return calendarGrid;
    };

    const calendarData = generateCalendar();
    const weeks = [];
    for (let i = 0; i < calendarData.length; i += 7) {
        weeks.push(calendarData.slice(i, i + 7));
    }

    // 2. Your exact original Design Classes
    const pillBaseClasses = 'self-start ml-2 px-3 py-1 text-sm sm:text-[15px] rounded-md font-medium text-center truncate shadow-sm mt-1 cursor-pointer';

    return (
        <TooltipProvider>
            <div className="overflow-x-auto rounded-2xl border border-borderColor dark:border-darkBorder mt-5">
                <table className="w-full border-collapse">
                    <thead className="bg-white dark:bg-darkSecondaryBg">
                        <tr>
                            {days.map((d, i) => (
                                <th
                                    key={i}
                                    className={`px-4 py-4 sm:text-xl font-bold text-headingTextColor dark:text-darkTextPrimary border-b border-gray-200 dark:border-darkBorder ${i < days.length - 1 ? 'border-r border-gray-200 dark:border-darkBorder' : ''}`}
                                >
                                    {d.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-darkSecondaryBg">
                        {weeks.map((week, weekIndex) => (
                            <tr key={weekIndex} className="h-26">
                                {week.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={`w-[14.285%] 
                                            ${weekIndex < weeks.length - 1 ? 'border-b border-gray-200 dark:border-darkBorder' : ''} 
                                            ${cellIndex < week.length - 1 ? 'border-r border-gray-200 dark:border-darkBorder' : ''}
                                            ${!cell.isCurrentMonth ? 'opacity-40 ' : ''}`}
                                    >
                                        <div className="flex flex-col items-center h-full pb-2">
                                            <div className="text-sm sm:text-base font-normal mb-1">{cell.date}</div>

                                            {/* Render mapped events with original styling */}
                                            {cell.events.map((event, eventIdx) => (
                                                <Dialog key={event.id || eventIdx}>
                                                    <Tooltip>
                                                        <DialogTrigger asChild>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={`${pillBaseClasses} 
                                                                        ${eventIdx === 0
                                                                            ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500'
                                                                            : 'bg-pink-100 text-pink-800 border-l-4 border-red-500'}`}
                                                                >
                                                                    {event.name}
                                                                </div>
                                                            </TooltipTrigger>
                                                        </DialogTrigger>

                                                        <EditEventModal event={event} />

                                                        <TooltipContent
                                                            className=" shadow-xl rounded-lg px-5 py-4 max-w-xs"
                                                        >
                                                            <h2 className="text-sm font-medium text-white dark:text-darkTextPrimary mb-3 border-b dark:border-darkBorder pb-1">
                                                                Event Participants
                                                            </h2>
                                                            <div className="flex items-center mb-4">
                                                                {event.eventAssigns?.slice(0, 3).map((assign: any, idx: number) => (
                                                                    <Avatar className='first:ml-0 -ml-3' key={idx}>
                                                                        <AvatarImage
                                                                            src={assign?.user?.image}
                                                                            alt={assign?.user?.name}
                                                                        />
                                                                        <AvatarFallback className=' text-darkTextSecondary'>{assign?.user?.name?.charAt(0)}</AvatarFallback>
                                                                    </Avatar>
                                                                ))}
                                                                {event.eventAssigns?.length > 3 && (
                                                                    <div className="w-10 h-10 -ml-3 text-headingTextColor rounded-full bg-[#ede7ff] flex items-center justify-center text-sm font-medium border border-white shadow-sm">
                                                                        {event.eventAssigns.length - 3}+
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <h3 className="text-sm font-medium text-white dark:text-darkTextPrimary border-b dark:border-darkBorder pb-1 mb-2">
                                                                Assigned By
                                                            </h3>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className=''>
                                                                    <AvatarImage
                                                                        src={event?.createdBy?.image}
                                                                        alt={event?.createdBy?.name}
                                                                    />
                                                                    <AvatarFallback className=' text-darkTextSecondary'>{event?.createdBy?.name?.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </Dialog>
                                            ))}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </TooltipProvider>
    );
};

export default CalenderTable;