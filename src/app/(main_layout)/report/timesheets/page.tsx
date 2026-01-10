import DayWeekMonthSelection from "@/components/Common/DayWeekMonthSelection";
import HeadingComponent from "@/components/Common/HeadingComponent";
import DayWeekMonthSelectionServer from "@/components/Report/TimeSheets/DayWeekMonthSelectionServer";
import ReportMonthlyTimeSheetServer from "@/components/Report/TimeSheets/ReportMonthlyTimeSheetServer";
import ReportWeeklyTimeSheetServer from "@/components/Report/TimeSheets/ReportWeeklyTimeSheetServer";
import { ISearchParamsProps } from "@/types/type";

const ReportTimeSheets = async ({ searchParams }: ISearchParamsProps) => {
    console.log("ReportTimeSheets");
    const params = await searchParams;
    type Tab = "daily" | "weekly" | "monthly";
    const activeTab = (params?.tab as Tab) ?? "daily";

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="All Timesheets" subHeading="All the timesheet by team member who completed is displayed here"></HeadingComponent>

                <DayWeekMonthSelection></DayWeekMonthSelection>
            </div>
            {
                activeTab === "daily" &&
                <DayWeekMonthSelectionServer searchParams={searchParams}></DayWeekMonthSelectionServer>
            }
            {
                activeTab === "weekly" &&
                <ReportWeeklyTimeSheetServer searchParams={searchParams}></ReportWeeklyTimeSheetServer>
            }
            {
                activeTab === "monthly" &&
                <ReportMonthlyTimeSheetServer searchParams={searchParams}></ReportMonthlyTimeSheetServer>
            }
        </div>
    );
};

export default ReportTimeSheets;