import { ISearchParamsProps } from "@/types/type";
import MonthlyTimeSheetsCalendar from "./MonthlyTimeSheetsCalendar";
import { getWeeklyAndMonthlyTimeEntry } from "@/actions/timesheets/action";

const MonthlyTimeSheetsServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;

    let result;
    if (params.start_month && params.end_month && params.user_id) {
        result = await getWeeklyAndMonthlyTimeEntry({
            from_date: params.start_month,
            to_date: params.end_month,
            user_id: params.user_id,
            project_id: params.project_id,
        });
    }
    console.log(result?.data?.totals);
    return (
        <div>
            <MonthlyTimeSheetsCalendar data={result?.data?.totals} />
        </div>
    );
};

export default MonthlyTimeSheetsServer;