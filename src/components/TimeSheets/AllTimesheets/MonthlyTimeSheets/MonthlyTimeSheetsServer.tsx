import { ISearchParamsProps } from "@/types/type";
import MonthlyTimeSheetsCalendar from "./MonthlyTimeSheetsCalendar";
import { getDateBaseTimeEntry } from "@/actions/report/action";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { resolveViewFilters } from "@/components/TimeSheets/viewFilters";
import { requireDataOrRefusal } from "@/lib/server/liveData";

const MonthlyTimeSheetsServer = async ({
  searchParams,
}: ISearchParamsProps) => {
  const params = await searchParams;
  const { user, userId, today } = await resolveViewFilters(params);
  // The viewer's calendar day, parsed locally for calendar arithmetic only.
  const day = parseISO(today);
  const monthStart = format(startOfMonth(day), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(day), "yyyy-MM-dd");
  const result = await getDateBaseTimeEntry({
    from_date: params.start_month ?? monthStart,
    to_date: params.end_month ?? monthEnd,
    user_id: userId,
    project_id: params.project_id,
    timezone: params?.timezone,
  });
  // A refusal (no access to the member, no such member, a plan that no longer
  // admits the read) keeps the empty month, with the API's reason; any other
  // failure throws.
  requireDataOrRefusal(result, "the monthly timesheet");

  return (
    <div>
      <MonthlyTimeSheetsCalendar
        logInUserId={user?.id}
        data={result?.data}
        message={result?.success === false ? result.message : undefined}
      />
    </div>
  );
};

export default MonthlyTimeSheetsServer;
