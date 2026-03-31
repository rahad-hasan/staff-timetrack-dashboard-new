import { getTimezones } from "@/actions/dashboard/action";
import { getDateBaseTimeEntry, getTimeEntry } from "@/actions/report/action";
import DayWeekMonthSelection from "@/components/Common/DayWeekMonthSelection";
import HeadingComponent from "@/components/Common/HeadingComponent";
import MonthPicker from "@/components/Common/MonthPicker";
import SelectDateRange from "@/components/Common/SelectDateRange";
import SelectTimezoneDropDown from "@/components/Common/SelectTimezoneDropDown";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
// import WeeklyDatePicker from "@/components/Common/WeeklyDatePicker";
import ReportDailyTimeSheet from "@/components/Report/TimeSheets/ReportDailyTimeSheet";
import ReportMonthlyTimeSheet from "@/components/Report/TimeSheets/ReportMonthlyTimeSheet";
import ReportWeeklyTimeSheet from "@/components/Report/TimeSheets/ReportWeeklyTimeSheet";
import ReportMonthlyTimesheetSkeleton from "@/skeleton/report/Timesheet/ReportMonthlyTimesheetSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { addDays, endOfMonth, format, startOfMonth } from "date-fns";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Staff Time Tracker Report Timesheets",
  description: "Staff Time Tracker Report Timesheets",
};

const ReportTimeSheets = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const user = await getDecodedUser();
  const currentDate = format(new Date(), "yyyy-MM-dd");

  const res = await getTimeEntry({
    date: params.date ?? currentDate,
    user_id: params.user_id ?? user?.id,
    timezone: params?.timezone,
  });

  // weekly
  const now = new Date();
  const weekUnformattedEnd = addDays(now, 6)
  const weekStart = format(now, "yyyy-MM-dd");
  const weekEnd = format(weekUnformattedEnd, "yyyy-MM-dd");

  const dateBasedTimeEntry = await getDateBaseTimeEntry({
    user_id: params.user_id ?? user?.id,
    from_date: params.from_date ?? weekStart,
    to_date: params.to_date ?? weekEnd,
    timezone: params?.timezone,
  });

  // month
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const result = await getDateBaseTimeEntry({
    user_id: params.user_id ?? user?.id,
    from_date: params.start_month ?? monthStart,
    to_date: params.end_month ?? monthEnd,
    timezone: params.timezone,
  });

  type Tab = "daily" | "weekly" | "monthly";
  const activeTab = (params?.tab as Tab) ?? "daily";

  const timezones = await getTimezones();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
        <HeadingComponent
          heading="All Timesheets"
          subHeading="All the timesheet by team member who completed is displayed here"
        />
        <DayWeekMonthSelection />
      </div>

      <div className="mb-5 flex flex-col gap-4 sm:flex-row justify-between">
        <div className="flex gap-4">
          {activeTab === "daily" && <SpecificDatePicker />}
          {/* {activeTab === "weekly" && <WeeklyDatePicker /> } */}
          {activeTab === "weekly" && <SelectDateRange/>}
          {activeTab === "monthly" && <MonthPicker />}

          <SelectTimezoneDropDown timezones={timezones} />
        </div>
        {/* <SelectUserDropDown users={users} /> */}
        <SelectUserWrapper />
      </div>

      {activeTab === "daily" && (
        <Suspense key={`daily-${params.date}`}>
          <ReportDailyTimeSheet
            dailyTimeEntry={res?.data}
          ></ReportDailyTimeSheet>
        </Suspense>
      )}

      {activeTab === "weekly" && (
        <Suspense key={`weekly-${params.from_date}-${params.to_date}`}>
          <ReportWeeklyTimeSheet
            dateBasedTimeEntry={dateBasedTimeEntry}
          ></ReportWeeklyTimeSheet>
        </Suspense>
      )}

      {activeTab === "monthly" && (
        <Suspense key={`monthly-${params.start_month}-${params.end_month}`} fallback={<ReportMonthlyTimesheetSkeleton />}>
          <ReportMonthlyTimeSheet
            data={result?.data?.daily_data}
          ></ReportMonthlyTimeSheet>
        </Suspense>
      )}
    </div>
  );
};

export default ReportTimeSheets;
