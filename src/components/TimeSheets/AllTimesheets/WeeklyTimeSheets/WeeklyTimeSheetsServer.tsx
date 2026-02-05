import { ISearchParamsProps } from "@/types/type";
import WeeklyTimeSheetsTable from "./WeeklyTimeSheetsTable";
import { getWeeklyAndMonthlyTimeEntry } from "@/actions/timesheets/action";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const WeeklyTimeSheetsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const user = await getDecodedUser();
  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const result = await getWeeklyAndMonthlyTimeEntry({
    from_date: params.from_date ?? weekStart,
    to_date: params.to_date ?? weekEnd,
    user_id: params.user_id ?? user?.id,
    project_id: params.project_id,
    timezone: params?.timezone,
  });

  return (
    <div>
      <WeeklyTimeSheetsTable
        items={result.data.items}
        dayKeys={result.data.day_keys}
        totals={result.data.totals}
      />
    </div>
  );
};

export default WeeklyTimeSheetsServer;
