import { getTimeEntry } from "@/actions/report/action";
import DayWeekMonthSelection from "@/components/Common/DayWeekMonthSelection";
import HeadingComponent from "@/components/Common/HeadingComponent";
import ReportDailyTimeSheet from "@/components/Report/TimeSheets/ReportDailyTimeSheet";
import ReportMonthlyTimeSheet from "@/components/Report/TimeSheets/ReportMonthlyTimeSheet";
import ReportWeeklyTimeSheet from "@/components/Report/TimeSheets/ReportWeeklyTimeSheet";
import { ISearchParamsProps } from "@/types/type";

const ReportTimeSheets = async ({ searchParams }: ISearchParamsProps) => {
    console.log("ReportTimeSheets");
    const params = await searchParams;
    type Tab = "Daily" | "Weekly" | "Monthly";
    const activeTab = (params?.tab as Tab) ?? "Daily";
    let dailyTimeEntry = null;
    if (params.date && params.user_id) {
        dailyTimeEntry = await getTimeEntry({
            date: params.date as string,
            user_id: Number(params.user_id),
        });
    }
    console.log('testing rendering every render');
    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="All Timesheets" subHeading="All the timesheet by team member who completed is displayed here"></HeadingComponent>

                <DayWeekMonthSelection></DayWeekMonthSelection>
            </div>
            {
                activeTab === "Daily" &&
                <ReportDailyTimeSheet dailyTimeEntry={dailyTimeEntry}></ReportDailyTimeSheet>
            }
            {
                activeTab === "Weekly" &&
                <ReportWeeklyTimeSheet></ReportWeeklyTimeSheet>
            }
            {
                activeTab === "Monthly" &&
                <ReportMonthlyTimeSheet></ReportMonthlyTimeSheet>
            }
        </div>
    );
};

export default ReportTimeSheets;