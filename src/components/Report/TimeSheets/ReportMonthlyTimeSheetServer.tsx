import { ISearchParamsProps } from "@/types/type";
import ReportMonthlyTimeSheet from "./ReportMonthlyTimeSheet";
import { getDateBaseTimeEntry } from "@/actions/report/action";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { endOfMonth, format, startOfMonth } from "date-fns";

const ReportMonthlyTimeSheetServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const user = await getDecodedUser();
    const now = new Date();
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

    const result = await getDateBaseTimeEntry({
        user_id: params.user_id ?? user?.id,
        from_date: params.start_month ?? monthStart,
        to_date: params.end_month ?? monthEnd,
    })

    return (
        <div>
            <ReportMonthlyTimeSheet data={result?.data?.daily_data}></ReportMonthlyTimeSheet>
        </div>
    );
};

export default ReportMonthlyTimeSheetServer;