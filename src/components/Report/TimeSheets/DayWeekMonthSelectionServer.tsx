import { ISearchParamsProps } from "@/types/type";
import ReportDailyTimeSheet from "./ReportDailyTimeSheet";
import { getTimeEntry } from "@/actions/report/action";

const DayWeekMonthSelectionServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    let dailyTimeEntry = null;
    if (params.date && params.user_id) {
        dailyTimeEntry = await getTimeEntry({
            date: params.date as string,
            user_id: Number(params.user_id),
        });
    }

    return (
        <div>
            <ReportDailyTimeSheet dailyTimeEntry={dailyTimeEntry}></ReportDailyTimeSheet>
        </div>
    );
};

export default DayWeekMonthSelectionServer;