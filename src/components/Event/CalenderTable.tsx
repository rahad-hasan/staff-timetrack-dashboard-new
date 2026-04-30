/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useMemo, useState } from "react";
import { formatTZDate, formatTZTime } from "@/utils";
import EventDetailsModal from "./EventDetailsModal";
import { GoogleIcon, MicrosoftIcon } from "./eventHelpers";
import { cn } from "@/lib/utils";

const EVENT_PALETTE = [
    "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400",
    "bg-amber-50 text-amber-800 border-l-4 border-amber-500 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400",
    "bg-blue-50 text-blue-800 border-l-4 border-blue-500 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-400",
    "bg-pink-50 text-pink-800 border-l-4 border-pink-500 dark:bg-pink-500/10 dark:text-pink-300 dark:border-pink-400",
    "bg-purple-50 text-purple-800 border-l-4 border-purple-500 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-400",
];

const getEventColor = (id: number | string | undefined, idx: number) => {
    const seed = typeof id === "number" ? id : idx;
    return EVENT_PALETTE[Math.abs(seed) % EVENT_PALETTE.length];
};

const CalenderTable = ({
    startMonth,
    endMonth,
    eventData,
}: {
    startMonth: string | number | string[] | undefined;
    endMonth: string | number | string[] | undefined;
    eventData: any[];
}) => {
    const [open, setOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    const days = [
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
        "SAT",
        "SUN",
    ];

    const todayKey = useMemo(() => formatTZDate(new Date()), []);

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

            const dayEvents = (eventData ?? []).filter(
                (event: any) => formatTZDate(new Date(event.start_time)) === dateString,
            );

            calendarGrid.push({
                fullDate: dateString,
                date: currentDate.getDate(),
                isCurrentMonth: currentDate.getMonth() === start.getMonth(),
                events: dayEvents,
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

    const handleEventClick = (event: any) => {
        setSelectedEvent(event);
        setOpen(true);
    };

    const handleCloseDialog = () => {
        setOpen(false);
    };

    return (
        <TooltipProvider>
            <div className="overflow-x-auto rounded-2xl border border-borderColor dark:border-darkBorder mt-5 bg-white dark:bg-darkSecondaryBg">
                <Dialog open={open} onOpenChange={setOpen}>
                    {selectedEvent && (
                        <EventDetailsModal
                            handleCloseDialog={handleCloseDialog}
                            event={selectedEvent}
                        />
                    )}
                </Dialog>

                <table className="w-full border-collapse">
                    <thead className="bg-bgSecondary/40 dark:bg-darkSecondaryBg">
                        <tr>
                            {days.map((d, i) => (
                                <th
                                    key={i}
                                    className={cn(
                                        "px-2 py-3 text-xs sm:text-sm font-semibold tracking-wider text-subTextColor dark:text-darkTextSecondary border-b border-borderColor dark:border-darkBorder",
                                        i < days.length - 1 &&
                                            "border-r border-borderColor dark:border-darkBorder",
                                    )}
                                >
                                    {d}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {weeks?.map((week, weekIndex) => (
                            <tr key={weekIndex} className="h-28 align-top">
                                {week.map((cell, cellIndex) => {
                                    const isToday = cell.fullDate === todayKey;
                                    return (
                                        <td
                                            key={cellIndex}
                                            className={cn(
                                                "w-[14.285%] p-1.5",
                                                weekIndex < weeks.length - 1 &&
                                                    "border-b border-borderColor dark:border-darkBorder",
                                                cellIndex < week.length - 1 &&
                                                    "border-r border-borderColor dark:border-darkBorder",
                                                !cell.isCurrentMonth &&
                                                    "bg-bgSecondary/40 dark:bg-darkPrimaryBg/30",
                                            )}
                                        >
                                            <div className="flex flex-col h-full gap-1">
                                                <div className="flex items-center justify-end px-1">
                                                    <span
                                                        className={cn(
                                                            "text-xs font-medium",
                                                            isToday
                                                                ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                                                                : cell.isCurrentMonth
                                                                  ? "text-headingTextColor dark:text-darkTextPrimary"
                                                                  : "text-subTextColor/50 dark:text-darkTextSecondary/50",
                                                        )}
                                                    >
                                                        {cell.date}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    {cell.events
                                                        .slice(0, 2)
                                                        .map((event: any, eventIdx: number) => (
                                                            <Tooltip key={event.id || eventIdx}>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleEventClick(event)}
                                                                        className={cn(
                                                                            "w-full text-left px-2 py-1 rounded-md text-[11px] sm:text-xs font-medium truncate flex items-center gap-1 cursor-pointer hover:opacity-90 transition",
                                                                            getEventColor(event.id, eventIdx),
                                                                        )}
                                                                    >
                                                                        {event.meeting_provider ===
                                                                            "google_meet" && (
                                                                            <GoogleIcon className="h-3 w-3 shrink-0" />
                                                                        )}
                                                                        {event.meeting_provider ===
                                                                            "microsoft_teams" && (
                                                                            <MicrosoftIcon className="h-3 w-3 shrink-0" />
                                                                        )}
                                                                        <span className="truncate">
                                                                            {event.name}
                                                                        </span>
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="shadow-xl rounded-lg px-4 py-3 max-w-xs dark:bg-darkPrimaryBg dark:border-darkBorder">
                                                                    <p className="text-xs font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                                                        {event.name}
                                                                    </p>
                                                                    <p className="text-[11px] text-subTextColor dark:text-darkTextSecondary mt-0.5">
                                                                        {formatTZTime(event?.start_time)} —{" "}
                                                                        {formatTZTime(event?.end_time)}
                                                                    </p>

                                                                    <div className="flex items-center mt-2">
                                                                        {event.eventAssigns
                                                                            ?.slice(0, 4)
                                                                            .map((assign: any, idx: number) => (
                                                                                <Avatar
                                                                                    key={idx}
                                                                                    className="first:ml-0 -ml-2 h-6 w-6 border-2 border-white dark:border-darkPrimaryBg"
                                                                                >
                                                                                    <AvatarImage
                                                                                        src={assign?.user?.image || ""}
                                                                                    />
                                                                                    <AvatarFallback className="text-[9px]">
                                                                                        {assign?.user?.name?.charAt(0)}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                            ))}
                                                                        {event.eventAssigns?.length > 4 && (
                                                                            <span className="-ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-bgSecondary dark:bg-darkSecondaryBg text-[10px] font-semibold text-headingTextColor dark:text-darkTextPrimary border-2 border-white dark:border-darkPrimaryBg">
                                                                                +{event.eventAssigns.length - 4}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))}
                                                    {cell.events.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEventClick(cell.events[2])
                                                            }
                                                            className="text-[10px] sm:text-[11px] font-medium text-primary hover:underline px-2 cursor-pointer text-left"
                                                        >
                                                            +{cell.events.length - 2} more
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </TooltipProvider>
    );
};

export default CalenderTable;
