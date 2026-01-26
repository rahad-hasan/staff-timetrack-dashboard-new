/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Dialog } from "../ui/dialog";
import EditEventModal from "./EditEventModal";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useState } from "react";
import { formatTZDate, formatTZTime } from "@/utils";
import { useLogInUserStore } from "@/store/logInUserStore";

// Helper to format date for matching
// const formatToISODate = (date: Date) => date?.toISOString().split('T')[0];

const CalenderTable = ({ startMonth, endMonth, eventData }: { startMonth: string | number | string[] | undefined, endMonth: string | number | string[] | undefined, eventData: any }) => {
    const logInUserData = useLogInUserStore(state => state.logInUserData);
    const [open, setOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
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
            const dateString = formatTZDate(currentDate);

            const dayEvents = eventData.filter((event: any) =>
                formatTZDate(new Date(event.start_time)) === dateString
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

    const pillBaseClasses = 'self-start ml-2 px-3 py-1 text-sm sm:text-[15px] rounded-md font-medium text-center truncate shadow-sm mt-1 cursor-pointer';
    const handleEventClick = (event: any) => {
        setSelectedEvent(event);
        setOpen(true);
    };

    const handleCloseDialog = () => {
        setOpen(false)
    }

    return (
        <TooltipProvider>
            <div className="overflow-x-auto rounded-2xl border border-borderColor dark:border-darkBorder mt-5">
                {
                    (logInUserData?.role === 'admin' ||
                        logInUserData?.role === 'manager' ||
                        logInUserData?.role === 'hr') &&
                    <Dialog open={open} onOpenChange={setOpen}>
                        {selectedEvent && (
                            <EditEventModal
                                handleCloseDialog={handleCloseDialog}
                                event={selectedEvent}
                            />
                        )}
                    </Dialog>
                }

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
                        {weeks?.map((week, weekIndex) => (
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
                                            {cell.events.map((event: any, eventIdx: any) => (
                                                <Tooltip key={event.id || eventIdx}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() => handleEventClick(event)}
                                                            className={`${pillBaseClasses}
                                                                        ${eventIdx === 0
                                                                    ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500'
                                                                    : 'bg-pink-100 text-pink-800 border-l-4 border-red-500'}`}
                                                        >
                                                            {event.name}
                                                        </div>
                                                    </TooltipTrigger>


                                                    <TooltipContent

                                                        className=" shadow-xl rounded-lg px-5 py-4 max-w-xs dark:bg-darkPrimaryBg"
                                                    >
                                                        <h2 className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary mb-3 border-b dark:border-darkBorder pb-1">
                                                            Event Participants
                                                        </h2>
                                                        <div className="flex items-center mb-4">
                                                            {event.eventAssigns?.slice(0, 3).map((assign: any, idx: number) => (
                                                                <Avatar className='first:ml-0 -ml-3' key={idx}>
                                                                    <AvatarImage
                                                                        src={assign?.user?.image}
                                                                        alt={assign?.user?.name}
                                                                    />
                                                                    <AvatarFallback className=' text-headingTextColor dark:text-darkTextPrimary'>{assign?.user?.name?.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                            ))}
                                                            {event.eventAssigns?.length > 3 && (
                                                                <div className="w-10 h-10 -ml-3 text-headingTextColor rounded-full bg-[#ede7ff] flex items-center justify-center text-sm font-medium border border-white shadow-sm">
                                                                    {event.eventAssigns.length - 3}+
                                                                </div>
                                                            )}
                                                        </div>

                                                        <h3 className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary border-b dark:border-darkBorder pb-1 mb-2">
                                                            Assigned By
                                                        </h3>
                                                        <div className="flex items-center gap-2  mb-4">
                                                            <Avatar className=''>
                                                                <AvatarImage
                                                                    src={event?.createdBy?.image}
                                                                    alt={event?.createdBy?.name}
                                                                />
                                                                <AvatarFallback className=' text-headingTextColor dark:text-darkTextPrimary'>{event?.createdBy?.name?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <h2 className=" text-sm text-headingTextColor dark:text-darkTextPrimary ">{event?.createdBy?.name}</h2>
                                                        </div>

                                                        <h3 className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary border-b dark:border-darkBorder pb-1 mb-2">
                                                            Date & Time
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <h2 className=" text-sm text-headingTextColor dark:text-darkTextPrimary ">{formatTZDate(event?.start_time)}, {formatTZTime(event?.start_time)}</h2>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
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