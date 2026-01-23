import { ISearchParamsProps } from "@/types/type";
import ReportWeeklyTimeSheet from "./ReportWeeklyTimeSheet";
import { getDateBaseTimeEntry } from "@/actions/report/action";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { endOfWeek, format, startOfWeek } from "date-fns";

const ReportWeeklyTimeSheetServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const user = await getDecodedUser();
    const now = new Date();
    // weekStartsOn: 0 is Sunday, 1 is Monday, 6 is Saturday
    // Most business dashboards use Monday (1) or Sunday (0)
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

    let dateBasedTimeEntry = null;
    if (params.from_date && params.to_date && params.user_id) {
        dateBasedTimeEntry = await getDateBaseTimeEntry({
            user_id: params.user_id ?? user?.id,
            from_date: params.from_date ?? weekStart,
            to_date: params.to_date ?? weekEnd,
        })
    }

    return (
        <div>
            <ReportWeeklyTimeSheet dateBasedTimeEntry={dateBasedTimeEntry}></ReportWeeklyTimeSheet>
        </div>
    );
};

export default ReportWeeklyTimeSheetServer;