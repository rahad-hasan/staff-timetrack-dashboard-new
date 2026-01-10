import { ISearchParamsProps } from "@/types/type";
import ReportWeeklyTimeSheet from "./ReportWeeklyTimeSheet";
import { getDateBaseTimeEntry } from "@/actions/report/action";

const ReportWeeklyTimeSheetServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    let dateBasedTimeEntry = null;
    if (params.from_date && params.to_date && params.user_id) {
        dateBasedTimeEntry = await getDateBaseTimeEntry({
            user_id: Number(params.user_id),
            from_date: params.from_date,
            to_date: params.to_date
        })
    }

    return (
        <div>
            <ReportWeeklyTimeSheet dateBasedTimeEntry={dateBasedTimeEntry}></ReportWeeklyTimeSheet>
        </div>
    );
};

export default ReportWeeklyTimeSheetServer;