import { ISearchParamsProps } from "@/types/type";
import ReportMonthlyTimeSheet from "./ReportMonthlyTimeSheet";
import { getDateBaseTimeEntry } from "@/actions/report/action";

const ReportMonthlyTimeSheetServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;

    let result = null;
    if (params.start_month && params.end_month && params.user_id) {
        result = await getDateBaseTimeEntry({
            user_id: Number(params.user_id),
            from_date: params.start_month,
            to_date: params.end_month
        })
    };

    return (
        <div>
            <ReportMonthlyTimeSheet data={result?.data?.daily_data}></ReportMonthlyTimeSheet>
        </div>
    );
};

export default ReportMonthlyTimeSheetServer;