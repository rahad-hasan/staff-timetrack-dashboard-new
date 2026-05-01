"use client";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useMemo, useState } from "react";
import { formatTZDate, formatTZFullDate, formatTZTime } from "@/utils";
import EventDetailsModal from "./EventDetailsModal";
import { GoogleIcon, MicrosoftIcon } from "./eventHelpers";
import { cn } from "@/lib/utils";
import { IEvent } from "@/types/type";
import { CalendarClock, CalendarRange, Users, Video } from "lucide-react";

const providerChip = (provider: string | null | undefined) => {
    if (provider === "google_meet") {
        return "border-emerald-200 bg-emerald-50/90 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200";
    }
    if (provider === "microsoft_teams") {
        return "border-indigo-200 bg-indigo-50/90 text-indigo-900 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-200";
    }
    return "border-slate-200 bg-slate-50/90 text-slate-800 dark:border-slate-500/25 dark:bg-slate-500/10 dark:text-slate-200";
};

const formatDuration = (start?: string, end?: string) => {
    if (!start || !end) return "0m";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;
    return `${minutes}m`;
};

const CalenderTable = ({
    startMonth,
    endMonth,
    eventData,
}: {
    startMonth: string | number | string[] | undefined;
    endMonth: string | number | string[] | undefined;
    eventData: IEvent[];
}) => {
    const [open, setOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);

    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

    const todayKey = useMemo(() => formatTZDate(new Date()), []);

    const metrics = useMemo(() => {
        const items = [...(eventData ?? [])].sort(
            (a, b) =>
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
        );
        const daysWithEvents = new Set(
            items.map((event) => formatTZDate(new Date(event.start_time))),
        ).size;
        const totalAttendees = items.reduce(
            (sum, event) => sum + (event.eventAssigns?.length ?? 0),
            0,
        );
        const meetingLinks = items.filter((event) => !!event.meeting_provider).length;
        const nextEvent =
            items.find((event) => new Date(event.end_time).getTime() >= Date.now()) ??
            null;

        return {
            totalEvents: items.length,
            totalAttendees,
            meetingLinks,
            daysWithEvents,
            nextEvent,
        };
    }, [eventData]);

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
                (event: IEvent) =>
                    formatTZDate(new Date(event.start_time)) === dateString,
            );

            calendarGrid.push({
                fullDate: dateString,
                date: currentDate.getDate(),
                isWeekend:
                    currentDate.getDay() === 0 || currentDate.getDay() === 6,
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

    const handleEventClick = (event: IEvent) => {
        setSelectedEvent(event);
        setOpen(true);
    };

    const handleCloseDialog = () => {
        setOpen(false);
    };

    return (
        <TooltipProvider>
            <div className="mt-5 space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-borderColor bg-white px-4 py-4 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-primary/10 p-2.5 text-primary">
                                <CalendarRange className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                                    Events this month
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    {metrics.totalEvents}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-borderColor bg-white px-4 py-4 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-primary/10 p-2.5 text-primary">
                                <Video className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                                    Meet / Teams sessions
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    {metrics.meetingLinks}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-borderColor bg-white px-4 py-4 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-primary/10 p-2.5 text-primary">
                                <Users className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                                    Total invites
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    {metrics.totalAttendees}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-borderColor bg-white px-4 py-4 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-primary/10 p-2.5 text-primary">
                                <CalendarClock className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                                    Next up
                                </p>
                                {metrics.nextEvent ? (
                                    <>
                                        <p className="mt-1 truncate text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                            {metrics.nextEvent.name}
                                        </p>
                                        <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary">
                                            {formatTZFullDate(metrics.nextEvent.start_time)} at{" "}
                                            {formatTZTime(metrics.nextEvent.start_time)}
                                        </p>
                                    </>
                                ) : (
                                    <p className="mt-1 text-sm font-medium text-subTextColor dark:text-darkTextSecondary">
                                        No upcoming events
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-borderColor/80 bg-white shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
                    <Sheet open={open} onOpenChange={setOpen}>
                        {selectedEvent && (
                            <EventDetailsModal
                                handleCloseDialog={handleCloseDialog}
                                event={selectedEvent}
                            />
                        )}
                    </Sheet>

                    <div className="flex flex-col gap-4 border-b border-borderColor/80 px-4 py-4 dark:border-darkBorder sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                Month overview
                            </p>
                            <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                                {metrics.daysWithEvents} active day
                                {metrics.daysWithEvents === 1 ? "" : "s"} scheduled. Click any
                                event chip to inspect it in the right-side drawer.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                                <GoogleIcon className="h-3.5 w-3.5" />
                                Google Meet
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                                <MicrosoftIcon className="h-3.5 w-3.5" />
                                Teams
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300">
                                <span className="size-2 rounded-full bg-slate-400" />
                                Internal event
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-[980px] w-full border-collapse">
                            <thead className="bg-linear-to-b from-bgSecondary/50 to-transparent dark:from-darkPrimaryBg/45 dark:to-transparent">
                                <tr>
                                    {days.map((day, index) => (
                                        <th
                                            key={day}
                                            className={cn(
                                                "px-3 py-3 text-left text-[11px] font-semibold tracking-[0.18em] uppercase text-subTextColor dark:text-darkTextSecondary border-b border-borderColor/80 dark:border-darkBorder",
                                                index < days.length - 1 &&
                                                    "border-r border-borderColor/80 dark:border-darkBorder",
                                            )}
                                        >
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {weeks.map((week, weekIndex) => (
                                    <tr key={weekIndex} className="align-top">
                                        {week.map((cell, cellIndex) => {
                                            const isToday = cell.fullDate === todayKey;
                                            return (
                                                <td
                                                    key={cell.fullDate}
                                                    className={cn(
                                                        "w-[14.285%] p-2 align-top transition-colors",
                                                        weekIndex < weeks.length - 1 &&
                                                            "border-b border-borderColor/80 dark:border-darkBorder",
                                                        cellIndex < week.length - 1 &&
                                                            "border-r border-borderColor/80 dark:border-darkBorder",
                                                        !cell.isCurrentMonth &&
                                                            "bg-bgSecondary/20 dark:bg-darkPrimaryBg/25",
                                                        cell.isCurrentMonth &&
                                                            "hover:bg-bgSecondary/35 dark:hover:bg-darkPrimaryBg/35",
                                                        isToday &&
                                                            "bg-primary/5 dark:bg-primary/8",
                                                    )}
                                                >
                                                    <div className="flex min-h-[168px] flex-col gap-2 rounded-lg p-1.5">
                                                        <div className="flex items-start justify-between gap-2 px-1">
                                                            <span
                                                                className={cn(
                                                                    "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold transition",
                                                                    isToday
                                                                        ? "bg-primary text-white shadow-sm"
                                                                        : cell.isCurrentMonth
                                                                          ? "text-headingTextColor dark:text-darkTextPrimary"
                                                                          : "text-subTextColor/45 dark:text-darkTextSecondary/45",
                                                                )}
                                                            >
                                                                {cell.date}
                                                            </span>
                                                            {cell.events.length > 0 && (
                                                                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                                                                    {cell.events.length} event
                                                                    {cell.events.length === 1
                                                                        ? ""
                                                                        : "s"}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-1 flex-col gap-2">
                                                            {cell.events.slice(0, 3).map((event) => {
                                                                const attendeeCount =
                                                                    event.eventAssigns?.length ?? 0;

                                                                return (
                                                                    <Tooltip key={event.id}>
                                                                        <TooltipTrigger asChild>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleEventClick(event)
                                                                                }
                                                                                className={cn(
                                                                                    "w-full rounded-md border px-2.5 py-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                                                                                    providerChip(
                                                                                        event.meeting_provider,
                                                                                    ),
                                                                                )}
                                                                            >
                                                                                <div className="flex items-start gap-2">
                                                                                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/70 dark:bg-white/10">
                                                                                        {event.meeting_provider ===
                                                                                        "google_meet" ? (
                                                                                            <GoogleIcon className="h-3.5 w-3.5" />
                                                                                        ) : event.meeting_provider ===
                                                                                          "microsoft_teams" ? (
                                                                                            <MicrosoftIcon className="h-3.5 w-3.5" />
                                                                                        ) : (
                                                                                            <span className="size-2 rounded-full bg-current/60" />
                                                                                        )}
                                                                                    </span>
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <div className="flex items-start justify-between gap-2">
                                                                                            <span className="truncate text-[11px] font-semibold sm:text-xs">
                                                                                                {event.name}
                                                                                            </span>
                                                                                            {attendeeCount > 0 && (
                                                                                                <span className="rounded-full bg-white/75 px-1.5 py-0.5 text-[9px] font-semibold dark:bg-white/10">
                                                                                                    {attendeeCount}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="mt-1 text-[10px] opacity-80 sm:text-[11px]">
                                                                                            {formatTZTime(
                                                                                                event.start_time,
                                                                                            )}{" "}
                                                                                            -{" "}
                                                                                            {formatTZTime(
                                                                                                event.end_time,
                                                                                            )}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent
                                                                            side="top"
                                                                            className="max-w-xs rounded-md px-4 py-3 shadow-xl dark:border-darkBorder dark:bg-darkPrimaryBg"
                                                                        >
                                                                            <p className="text-xs font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                                                                {event.name}
                                                                            </p>
                                                                            <p className="mt-0.5 text-[11px] text-subTextColor dark:text-darkTextSecondary">
                                                                                {formatTZFullDate(
                                                                                    event.start_time,
                                                                                )}{" "}
                                                                                ·{" "}
                                                                                {formatTZTime(
                                                                                    event.start_time,
                                                                                )}{" "}
                                                                                -{" "}
                                                                                {formatTZTime(
                                                                                    event.end_time,
                                                                                )}
                                                                            </p>
                                                                            <p className="mt-1 text-[11px] text-subTextColor dark:text-darkTextSecondary">
                                                                                Duration:{" "}
                                                                                {formatDuration(
                                                                                    event.start_time,
                                                                                    event.end_time,
                                                                                )}
                                                                            </p>

                                                                            <div className="mt-3 flex items-center">
                                                                                {event.eventAssigns
                                                                                    ?.slice(0, 4)
                                                                                    .map(
                                                                                        (
                                                                                            assign,
                                                                                            idx,
                                                                                        ) => (
                                                                                            <Avatar
                                                                                                key={`${event.id}-${assign.user?.id}-${idx}`}
                                                                                                className="first:ml-0 -ml-2 h-6 w-6 border-2 border-white dark:border-darkPrimaryBg"
                                                                                            >
                                                                                                <AvatarImage
                                                                                                    src={
                                                                                                        assign
                                                                                                            ?.user
                                                                                                            ?.image ||
                                                                                                        ""
                                                                                                    }
                                                                                                />
                                                                                                <AvatarFallback className="text-[9px]">
                                                                                                    {assign?.user?.name?.charAt(
                                                                                                        0,
                                                                                                    )}
                                                                                                </AvatarFallback>
                                                                                            </Avatar>
                                                                                        ),
                                                                                    )}
                                                                                {attendeeCount > 4 && (
                                                                                    <span className="-ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-bgSecondary text-[10px] font-semibold text-headingTextColor border-2 border-white dark:border-darkPrimaryBg dark:bg-darkSecondaryBg dark:text-darkTextPrimary">
                                                                                        +
                                                                                        {attendeeCount -
                                                                                            4}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                );
                                                            })}

                                                            {cell.events.length > 3 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleEventClick(
                                                                            cell.events[3],
                                                                        )
                                                                    }
                                                                    className="rounded-md border border-dashed border-borderColor px-3 py-2 text-left text-[11px] font-medium text-primary transition hover:border-primary/40 hover:bg-primary/5 dark:border-darkBorder"
                                                                >
                                                                    View {cell.events.length - 3} more
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
                </div>
            </div>
        </TooltipProvider>
    );
};

export default CalenderTable;
