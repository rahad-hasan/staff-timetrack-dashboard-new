import { ISearchParamsProps } from "@/types/type";
import CalenderTable from "./CalenderTable";
import { getEvents } from "@/actions/calendarEvent/action";
import { endOfMonth, format, isValid, parse, startOfMonth } from "date-fns";
import { getViewerTimeZone } from "@/lib/server/session";
import { todayIn } from "@/lib/timezone";

const DAY = "yyyy-MM-dd";

const CalenderTableServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;

    // The month on screen: the `start_month` the MonthPicker wrote, else the
    // viewer's current month in THEIR zone — the server's own clock would
    // show the previous month to anyone east of it for a few hours on the
    // 1st. Parsed as a calendar date (never `new Date("yyyy-MM-dd")`, which
    // is UTC midnight), and garbage in the URL falls back to the default
    // instead of crashing the grid.
    const requested =
        typeof params.start_month === "string"
            ? parse(params.start_month, DAY, new Date())
            : null;
    const anchor =
        requested && isValid(requested)
            ? requested
            : parse(todayIn(await getViewerTimeZone()), DAY, new Date());

    const startMonth = format(startOfMonth(anchor), DAY);
    const endMonth = format(endOfMonth(anchor), DAY);

    const result = await getEvents({
        year: anchor.getFullYear(),
        month: anchor.getMonth() + 1,
    });

    return (
        <CalenderTable startMonth={startMonth} endMonth={endMonth} eventData={result?.data ?? []}></CalenderTable>
    );
};

export default CalenderTableServer;
