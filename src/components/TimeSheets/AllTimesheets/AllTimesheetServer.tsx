import { ISearchParamsProps } from "@/types/type";
import DailyTimeSheets from "./DailyTimeSheets/DailyTimeSheets";
import MonthlyTimeSheets from "./MonthlyTimeSheets/MonthlyTimeSheets";
import WeeklyTimeSheets from "./WeeklyTimeSheets/WeeklyTimeSheets";
import { getDailyTimeEntry } from "@/actions/timesheets/action";

const AllTimesheetServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    type Tab = "daily" | "weekly" | "monthly";
    const activeTab = (params?.tab as Tab) ?? "daily";

    let result = null;
    if (params.date && params.user_id) {
        result = await getDailyTimeEntry({
            search: params.search,
            date: params.date,
            user_id: params.user_id,
        });
    }

    const dailyData = result?.data ?? {
        items: [],
        totals: { duration_hours: 0, duration_formatted: "00:00:00" }
    };
    console.log(dailyData);
    
    return (
        <div>
            {
                activeTab === "daily" &&
                <DailyTimeSheets data={dailyData}></DailyTimeSheets>
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