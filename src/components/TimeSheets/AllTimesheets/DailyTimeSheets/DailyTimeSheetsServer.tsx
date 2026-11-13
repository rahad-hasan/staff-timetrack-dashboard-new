import { getDailyTimeEntry } from "@/actions/timesheets/action";
import { ISearchParamsProps } from "@/types/type";
import DailyTimeSheets from "./DailyTimeSheets";
import AppPagination from "@/components/Common/AppPagination";
import { getTimeEntry } from "@/actions/report/action";
import { resolveViewFilters } from "@/components/TimeSheets/viewFilters";
import { requireDataOrRefusal } from "@/lib/server/liveData";

const DailyTimeSheetsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const { user, userId, zone, date } = await resolveViewFilters(params);

  const filters = {
    date,
    user_id: userId,
    project_id: params.project_id,
    timezone: params.timezone,
  };

  // The table and the timeline bar are independent reads of the same day.
  const [result, timeLineData] = await Promise.all([
    getDailyTimeEntry({ ...filters, search: params.search }),
    getTimeEntry(filters),
  ]);
  // A refusal (no access to the member, no such member, a filter the API
  // cannot read) keeps the empty day below, with the API's reason in its
  // empty state; any other failure must not pass for a day without work.
  requireDataOrRefusal(result, "the daily timesheet");
  requireDataOrRefusal(timeLineData, "the daily timeline");

  const dailyData = result?.data ?? {
    items: [],
    totals: { duration_hours: 0, duration_formatted: "00:00:00" },
  };

  return (
    <>
      <DailyTimeSheets
        data={dailyData}
        timeLineData={timeLineData?.data}
        selectedDate={date}
        timeZone={zone}
        // Mirrors the backend: DELETE /time-entries/remove-manual-time is admin-only.
        canDeleteManual={user?.role === "admin"}
        message={result?.success === false ? result.message : undefined}
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
