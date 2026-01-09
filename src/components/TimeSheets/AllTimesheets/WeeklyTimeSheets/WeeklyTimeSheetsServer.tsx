import { ISearchParamsProps } from "@/types/type";
import WeeklyTimeSheetsTable from "./WeeklyTimeSheetsTable";
import { getWeeklyAndMonthlyTimeEntry } from "@/actions/timesheets/action";

const WeeklyTimeSheetsServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    let result;
    if (params.from_date && params.to_date && params.user_id) {
        result = await getWeeklyAndMonthlyTimeEntry({
            from_date: params.from_date,
            to_date: params.to_date,
            user_id: params.user_id,
            project_id: params.project_id,
        });
    }
    return (
        <div>
            <WeeklyTimeSheetsTable data={result?.data?.items}></WeeklyTimeSheetsTable>
        </div>
    );
};

export default WeeklyTimeSheetsServer;