import { ISearchParamsProps } from "@/types/type";
import WeeklyTimeSheetsTable from "./WeeklyTimeSheetsTable";
import { getWeeklyAndMonthlyTimeEntry } from "@/actions/timesheets/action";
import { endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { resolveViewFilters } from "@/components/TimeSheets/viewFilters";
import { requireDataOrRefusal } from "@/lib/server/liveData";

const WeeklyTimeSheetsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const { userId, today } = await resolveViewFilters(params);
  // `today` is the viewer's calendar day; parsed as a local date it is only
  // used for calendar arithmetic, so the server's own zone cannot shift it.
  const day = parseISO(today);
  const weekStart = format(startOfWeek(day, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(day, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const result = await getWeeklyAndMonthlyTimeEntry({
    from_date: params.from_date ?? weekStart,
    to_date: params.to_date ?? weekEnd,
    user_id: userId,
    project_id: params.project_id,
    timezone: params?.timezone,
  });

  // The API's refusal (no access to the member, no such member, a bad range)
  // shows its message in the empty state. Any other failure throws: an
  // outage must not pass for a week without work.
  requireDataOrRefusal(result, "the weekly timesheet");
  const week = result?.data;

  return (
      <WeeklyTimeSheetsTable
        items={week?.items ?? []}
        dayKeys={week?.day_keys ?? []}
        totals={week?.totals ?? { duration_formatted: "00:00:00", per_day: {} }}
        message={result?.success === false ? result.message : undefined}
      />
  );
};

export default WeeklyTimeSheetsServer;
