import { ISearchParamsProps } from "@/types/type";
import DailyTimeSheets from "./DailyTimeSheets/DailyTimeSheets";
import MonthlyTimeSheets from "./MonthlyTimeSheets/MonthlyTimeSheets";
import WeeklyTimeSheets from "./WeeklyTimeSheets/WeeklyTimeSheets";

const AllTimesheetServer = async({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    console.log("test test test test",params);
    type Tab = "daily" | "weekly" | "monthly";
    const activeTab = (params?.tab as Tab) ?? "daily";
    return (
        <div>
            {
                activeTab === "daily" &&
                <DailyTimeSheets></DailyTimeSheets>
            }

            {
                activeTab === "weekly" &&
                <WeeklyTimeSheets></WeeklyTimeSheets>
            }

            {
                activeTab === "monthly" &&
                <MonthlyTimeSheets></MonthlyTimeSheets>
            }
        </div>
    );
};

export default AllTimesheetServer;