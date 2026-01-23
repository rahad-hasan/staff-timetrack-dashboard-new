import { getDailyTimeEntry } from "@/actions/timesheets/action";
import { ISearchParamsProps } from "@/types/type";
import DailyTimeSheets from "./DailyTimeSheets";
import AppPagination from "@/components/Common/AppPagination";
import { getTimeEntry } from "@/actions/report/action";
import { cookies } from "next/headers";
import { format } from "date-fns";

const DailyTimeSheetsServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const currentDate = format(new Date(), "yyyy-MM-dd");

    const result = await getDailyTimeEntry({
        search: params.search,
        date: params.date ?? currentDate,
        user_id: params.user_id ?? userId,
        project_id: params.project_id,
    });
    
    const timeLineData = await getTimeEntry({
        date: params.date ?? currentDate,
        user_id: params.user_id ?? userId,
        project_id: params.project_id,
    });


    const dailyData = result?.data ?? {
        items: [],
        totals: { duration_hours: 0, duration_formatted: "00:00:00" }
    };

    return (
        <>
            <DailyTimeSheets data={dailyData} timeLineData={timeLineData?.data} selectedDate={params.date}></DailyTimeSheets>
            <AppPagination
                total={result?.meta?.total ?? 1}
                currentPage={params.page as number}
                limit={result?.meta?.limit ?? 10}
            />
        </>
    );
};

export default DailyTimeSheetsServer;