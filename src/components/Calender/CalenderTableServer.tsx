import { ISearchParamsProps } from "@/types/type";
import CalenderTable from "./CalenderTable";
import { getEvents } from "@/actions/calendarEvent/action";

const CalenderTableServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const startMonth = params.start_month
    const endMonth = params.end_month
    const [year, month] = String(startMonth).split("-");

    let result;
    if (year && month) {
        result = await getEvents({
            year: year,
            month: month,
        });
    }

    return (
        <div>
            {
                year && month &&
                <>
                    <CalenderTable startMonth={startMonth} endMonth={endMonth} eventData={result?.data}></CalenderTable>
                </>
            }
        </div>
    );
};

export default CalenderTableServer;