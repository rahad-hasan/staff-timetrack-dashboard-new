import { getDailyTimeEntry } from "@/actions/timesheets/action";
import { ISearchParams } from "@/types/type";
import DailyTimeSheets from "./DailyTimeSheets";
import AppPagination from "@/components/Common/AppPagination";
import { getTimeEntry } from "@/actions/report/action";
import { format } from "date-fns";
import { getDecodedUser } from "@/utils/decodedLogInUser";

type TimezoneOption = {
  value: string;
  label: string;
};

const DailyTimeSheetsServer = async ({
  searchParams,
  timezones,
}: {
  searchParams: ISearchParams;
  timezones: { data: TimezoneOption[]; defaultValue: string };
}) => {
  const params = await searchParams;
  const user = await getDecodedUser();
  const userId = user?.id;
  const currentDate = format(new Date(), "yyyy-MM-dd");

  const result = await getDailyTimeEntry({
    search: params.search,
    date: params.date ?? currentDate,
    user_id: params.user_id ?? userId,
    project_id: params.project_id,
    timezone: params?.timezone,
  });

  const timeLineData = await getTimeEntry({
    date: params.date ?? currentDate,
    user_id: params.user_id ?? userId,
    project_id: params.project_id,
    timezone: params?.timezone,
  });

  const dailyData = result?.data ?? {
    items: [],
    totals: { duration_hours: 0, duration_formatted: "00:00:00" },
  };

  return (
    <>
      <DailyTimeSheets
        data={dailyData}
        timeLineData={timeLineData?.data}
        selectedDate={params.date}
        timezones={timezones}
      ></DailyTimeSheets>
      <AppPagination
        total={result?.meta?.total ?? 1}
        currentPage={params.page as number}
        limit={result?.meta?.limit ?? 10}
      />
    </>
  );
};

export default DailyTimeSheetsServer;
