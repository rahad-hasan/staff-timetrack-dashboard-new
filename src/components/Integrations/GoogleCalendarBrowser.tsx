/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { getGoogleEvents } from "@/actions/integrations/action";
import { GoogleEventsListItem } from "@/types/type";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover";
import { Calendar } from "../ui/calendar";
import {
    CalendarDays,
    ChevronDownIcon,
    ExternalLink,
    Loader2,
    Search,
    Users,
    Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GoogleIcon } from "../Event/eventHelpers";
import { Avatar, AvatarFallback } from "../ui/avatar";

const isoDay = (d: Date) => format(d, "yyyy-MM-dd");

const fmtTime = (item: GoogleEventsListItem) => {
    const startIso = item.start.dateTime ?? item.start.date;
    const endIso = item.end.dateTime ?? item.end.date;
    if (!startIso || !endIso) return "All day";
    const allDay = !!item.start.date && !item.start.dateTime;
    if (allDay) return "All day";
    try {
        return `${format(new Date(startIso), "h:mm a")} – ${format(new Date(endIso), "h:mm a")}`;
    } catch {
        return "—";
    }
};

const groupByDay = (items: GoogleEventsListItem[]) => {
    const buckets = new Map<string, GoogleEventsListItem[]>();
    for (const it of items) {
        const startIso = it.start.dateTime ?? it.start.date;
        if (!startIso) continue;
        const key = format(new Date(startIso), "yyyy-MM-dd");
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key)!.push(it);
    }
    return Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
};

const Skeleton = () => (
    <div className="space-y-3">
        {[0, 1, 2].map((i) => (
            <div
                key={i}
                className="h-16 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 animate-pulse"
            />
        ))}
    </div>
);

const GoogleCalendarBrowser = () => {
    const today = useMemo(() => new Date(), []);
    const [start, setStart] = useState<Date>(startOfMonth(today));
    const [end, setEnd] = useState<Date>(endOfMonth(today));
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<GoogleEventsListItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [calendarFilter, setCalendarFilter] = useState<string | "">("");
    const [openStart, setOpenStart] = useState(false);
    const [openEnd, setOpenEnd] = useState(false);

    const calendars = useMemo(() => {
        const map = new Map<string, GoogleEventsListItem["calendar"]>();
        events.forEach((e) => map.set(e.calendar.id, e.calendar));
        return Array.from(map.values());
    }, [events]);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const res: any = await getGoogleEvents({
                start_date: isoDay(start),
                end_date: isoDay(end),
                calendar_id: calendarFilter || undefined,
            });
            if (res?.success === false) {
                setEvents([]);
                setError(res?.message || "Failed to load Google events");
                return;
            }
            const data: GoogleEventsListItem[] = res?.data ?? res ?? [];
            setEvents(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err?.message || "Failed to load Google events");
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        if (!calendarFilter) return events;
        return events.filter((e) => e.calendar.id === calendarFilter);
    }, [events, calendarFilter]);

    const grouped = useMemo(() => groupByDay(filtered), [filtered]);

    return (
        <div className="rounded-2xl border border-borderColor dark:border-darkBorder bg-white dark:bg-darkSecondaryBg overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-borderColor dark:border-darkBorder">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-bgSecondary dark:bg-darkPrimaryBg border border-borderColor dark:border-darkBorder flex items-center justify-center shrink-0">
                        <GoogleIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                            Google Calendar events
                        </h3>
                        <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                            Browse events from your connected Google account.
                        </p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Popover open={openStart} onOpenChange={setOpenStart}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline2"
                                type="button"
                                className="w-full justify-between font-normal text-headingTextColor dark:text-darkTextPrimary dark:bg-darkPrimaryBg dark:border-darkBorder"
                            >
                                <span className="flex items-center gap-2 text-xs">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    From: {format(start, "MMM d, yyyy")}
                                </span>
                                <ChevronDownIcon className="h-3.5 w-3.5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={start}
                                onSelect={(d) => {
                                    if (d) {
                                        setStart(d);
                                        setOpenStart(false);
                                    }
                                }}
                            />
                        </PopoverContent>
                    </Popover>

                    <Popover open={openEnd} onOpenChange={setOpenEnd}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline2"
                                type="button"
                                className="w-full justify-between font-normal text-headingTextColor dark:text-darkTextPrimary dark:bg-darkPrimaryBg dark:border-darkBorder"
                            >
                                <span className="flex items-center gap-2 text-xs">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    To: {format(end, "MMM d, yyyy")}
                                </span>
                                <ChevronDownIcon className="h-3.5 w-3.5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={end}
                                disabled={(d) => d < start}
                                onSelect={(d) => {
                                    if (d) {
                                        setEnd(d);
                                        setOpenEnd(false);
                                    }
                                }}
                            />
                        </PopoverContent>
                    </Popover>

                    <select
                        value={calendarFilter}
                        onChange={(e) => setCalendarFilter(e.target.value)}
                        className="h-10 px-3 rounded-md border border-borderColor dark:border-darkBorder bg-white dark:bg-darkPrimaryBg text-xs text-headingTextColor dark:text-darkTextPrimary cursor-pointer"
                    >
                        <option value="">All calendars</option>
                        {calendars.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.summary}
                            </option>
                        ))}
                    </select>

                    <Button
                        onClick={fetchEvents}
                        disabled={loading || end < start}
                        className="gap-2"
                    >
                        {loading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Search className="h-3.5 w-3.5" />
                        )}
                        Search
                    </Button>
                </div>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
                {loading && <Skeleton />}

                {!loading && error && (
                    <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                {!loading && !error && grouped.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-bgSecondary dark:bg-darkPrimaryBg border border-borderColor dark:border-darkBorder flex items-center justify-center">
                            <CalendarDays className="h-5 w-5 text-subTextColor dark:text-darkTextSecondary" />
                        </div>
                        <p className="mt-3 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                            No events in this range
                        </p>
                        <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                            Try a different date range or calendar.
                        </p>
                    </div>
                )}

                {!loading &&
                    !error &&
                    grouped.map(([day, items]) => (
                        <div key={day}>
                            <h4 className="text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary mb-2">
                                {format(new Date(day), "EEEE, MMMM d")}
                            </h4>
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div
                                        key={`${item.calendar.id}-${item.id}`}
                                        className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3"
                                    >
                                        <div
                                            className="w-1 sm:h-12 h-1.5 rounded-full shrink-0"
                                            style={{
                                                backgroundColor:
                                                    item.calendar.backgroundColor || "#12cd69",
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary truncate">
                                                {item.summary || "(No title)"}
                                            </p>
                                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-subTextColor dark:text-darkTextSecondary">
                                                <span>{fmtTime(item)}</span>
                                                {item.attendees && item.attendees.length > 0 && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {item.attendees.length}
                                                    </span>
                                                )}
                                                {item.hangoutLink && (
                                                    <span className="inline-flex items-center gap-1 text-primary">
                                                        <Video className="h-3 w-3" /> Meet
                                                    </span>
                                                )}
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1 rounded px-1.5 py-px text-[10px] border",
                                                        "border-borderColor dark:border-darkBorder bg-white dark:bg-darkSecondaryBg",
                                                    )}
                                                >
                                                    <Avatar className="h-3 w-3">
                                                        <AvatarFallback
                                                            className="text-[7px]"
                                                            style={{
                                                                backgroundColor:
                                                                    item.calendar.backgroundColor ||
                                                                    "transparent",
                                                                color:
                                                                    item.calendar.foregroundColor ||
                                                                    undefined,
                                                            }}
                                                        >
                                                            {item.calendar.summary?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {item.calendar.summary}
                                                </span>
                                            </div>
                                        </div>
                                        {item.htmlLink && (
                                            <a
                                                href={item.htmlLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                                            >
                                                Open <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default GoogleCalendarBrowser;
