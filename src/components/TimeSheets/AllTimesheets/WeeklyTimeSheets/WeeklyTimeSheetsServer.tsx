import { ISearchParamsProps } from "@/types/type";
import WeeklyTimeSheetsTable from "./WeeklyTimeSheetsTable";
import { getWeeklyAndMonthlyTimeEntry } from "@/actions/timesheets/action";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const WeeklyTimeSheetsServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const user = await getDecodedUser();
    const now = new Date();
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

    const result = await getWeeklyAndMonthlyTimeEntry({
        from_date: params.from_date ?? weekStart,
        to_date: params.to_date ?? weekEnd,
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