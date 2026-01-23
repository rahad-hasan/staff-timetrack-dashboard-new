import { ISearchParamsProps } from "@/types/type";
import WeeklyTimeSheetsTable from "./WeeklyTimeSheetsTable";
import { getWeeklyAndMonthlyTimeEntry } from "@/actions/timesheets/action";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const WeeklyTimeSheetsServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const user = await getDecodedUser();
    const now = new Date();
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

    const result = await getWeeklyAndMonthlyTimeEntry({
        from_date: params.from_date ?? monthStart,
        to_date: params.to_date ?? monthEnd,
        user_id: params.user_id ?? user?.id,
        project_id: params.project_id,
    });

    return (
        <div>
            <WeeklyTimeSheetsTable data={result?.data?.items}></WeeklyTimeSheetsTable>
        </div>
    );
};

export default WeeklyTimeSheetsServer;