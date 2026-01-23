import { ISearchParamsProps } from "@/types/type";
import CalenderTable from "./CalenderTable";
import { getEvents } from "@/actions/calendarEvent/action";
import { endOfMonth, format, startOfMonth } from "date-fns";

const CalenderTableServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const now = new Date();
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

    const startMonth = params.start_month ?? monthStart
    const endMonth = params.end_month ?? monthEnd
    const [year, month] = String(startMonth).split("-");

    const result = await getEvents({
        year: year,
        month: month,
    });

    return (
        <div>

            <CalenderTable startMonth={startMonth} endMonth={endMonth} eventData={result?.data}></CalenderTable>

        </div>
    );
};

export default CalenderTableServer;