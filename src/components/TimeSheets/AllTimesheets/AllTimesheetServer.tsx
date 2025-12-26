import { ISearchParamsProps } from "@/types/type";
import DailyTimeSheets from "./DailyTimeSheets/DailyTimeSheets";
import MonthlyTimeSheets from "./MonthlyTimeSheets/MonthlyTimeSheets";
import WeeklyTimeSheets from "./WeeklyTimeSheets/WeeklyTimeSheets";

const AllTimesheetServer = async({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    console.log(params);
    type Tab = "Daily" | "Weekly" | "Monthly";
    const activeTab = (params?.tab as Tab) ?? "Daily";
    return (
        <div>
            {
                activeTab === "Daily" &&
                <DailyTimeSheets></DailyTimeSheets>
            }

            {
                activeTab === "Weekly" &&
                <WeeklyTimeSheets></WeeklyTimeSheets>
            }

            {
                activeTab === "Monthly" &&
                <MonthlyTimeSheets></MonthlyTimeSheets>
            }
        </div>
    );
};

export default AllTimesheetServer;