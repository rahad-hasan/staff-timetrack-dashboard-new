import { addDays, format, parseISO, startOfWeek, type Day } from "date-fns";
import { todayIn } from "@/lib/timezone";
import HeadingComponent from '../Common/HeadingComponent';
import DayWeekMonthSelection from '../Common/DayWeekMonthSelection';
import type { DashboardTab } from "./dashboardParams";

/** "Wed, Oct 01, 2025" — the shape `toLocaleDateString` printed before. */
const DAY_FORMAT = "EEE, MMM dd, yyyy";

/** date-fns day order: the index is `weekStartsOn`. */
const WEEK_DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const;

/**
 * `Company.week_start` → date-fns `weekStartsOn`, mapped exactly like the
 * API's `Helper.getWeekStartIndex` (the exact day name, anything else is
 * Monday). The weekly stats are computed from that index, so the heading must
 * use the same one to name the week they cover.
 */
const weekStartsOnFor = (weekStart?: string | null): Day => {
    const index = WEEK_DAYS.findIndex((day) => day === weekStart);
    return index === -1 ? 1 : (index as Day);
};

/**
 * The period the selected tab covers, as the viewer's calendar sees it.
 *
 * Built from the viewer's date rather than `new Date()`: this renders on the
 * server, whose zone is not the viewer's, so around midnight the heading named
 * the wrong day. The week starts on the company's week start, as the stats
 * below do (the backend builds the weekly window from it), and date-fns does
 * the arithmetic the hand-rolled version got wrong: on a Sunday (`getDay()`
 * is 0) it jumped to NEXT week, and a week spanning two months printed an end
 * date built in the current month ("Mon, Sep 29 - Tue, Nov 04").
 */
const periodLabel = (
    tab: DashboardTab,
    timeZone: string,
    weekStartsOn: Day,
): string => {
    // A plain local date: everything below is day arithmetic, never instants.
    const today = parseISO(todayIn(timeZone));

    if (tab === "monthly") return format(today, "MMM yyyy");

    if (tab === "weekly") {
        const start = startOfWeek(today, { weekStartsOn });
        return `${format(start, DAY_FORMAT)} - ${format(addDays(start, 6), DAY_FORMAT)}`;
    }

    return format(today, DAY_FORMAT);
};

const HeroHeading = ({
    tab,
    timeZone,
    weekStart,
}: {
    tab: DashboardTab;
    timeZone: string;
    /** The company's `week_start` ("Sunday" … "Saturday"); Monday when unknown. */
    weekStart?: string | null;
}) => {
    return (

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
            <HeadingComponent heading="Dashboard" subHeading={periodLabel(tab, timeZone, weekStartsOnFor(weekStart))}></HeadingComponent>
            <DayWeekMonthSelection></DayWeekMonthSelection>
        </div>

    );
};

export default HeroHeading;
