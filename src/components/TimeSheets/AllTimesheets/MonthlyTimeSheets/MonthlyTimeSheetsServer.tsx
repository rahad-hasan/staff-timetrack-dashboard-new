import { ISearchParamsProps } from "@/types/type";
import MonthlyTimeSheetsCalendar from "./MonthlyTimeSheetsCalendar";
import { getDateBaseTimeEntry } from "@/actions/report/action";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { endOfMonth, format, startOfMonth } from "date-fns";

const MonthlyTimeSheetsServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const user = await getDecodedUser();
    const now = new Date();
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

    const result = await getDateBaseTimeEntry({
        from_date: params.start_month ?? monthStart,
        to_date: params.end_month ?? monthEnd,
        user_id: params.user_id ?? user?.id,
        project_id: params.project_id,
    });

    return (
        <div>
            <MonthlyTimeSheetsCalendar data={result?.data} />
        </div>
    );
};

export default MonthlyTimeSheetsServer;