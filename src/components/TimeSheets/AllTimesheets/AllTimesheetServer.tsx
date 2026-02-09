import { ISearchParamsProps } from "@/types/type";
import DailyTimeSheetsServer from "./DailyTimeSheets/DailyTimeSheetsServer";
import MonthlyTimeSheetsServer from "./MonthlyTimeSheets/MonthlyTimeSheetsServer";
import WeeklyTimeSheetsServer from "./WeeklyTimeSheets/WeeklyTimeSheetsServer";
import { Suspense } from "react";
import DailyTimeSheetsSkeleton from "@/skeleton/timesheets/allTimesheets/DailyTimeSheetsSkeleton";
import WeeklyTimeSheetsSkeleton from "@/skeleton/timesheets/allTimesheets/WeeklyTimeSheetsSkeleton";
import MonthlyTimeSheetsCalendarSkeleton from "@/skeleton/timesheets/allTimesheets/MonthlyTimeSheetsCalendarSkeleton";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import MonthPicker from "@/components/Common/MonthPicker";
import WeeklyDatePicker from "@/components/Common/WeeklyDatePicker";
import SelectProjectWrapper from "@/components/Common/SelectProjectWrapper";
import SelectTimezoneDropDown from "@/components/Common/SelectTimezoneDropDown";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import { getTimezones } from "@/actions/dashboard/action";

const AllTimesheetServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;

  type Tab = "daily" | "weekly" | "monthly";
  const activeTab = (params?.tab as Tab) ?? "daily";

  const timezones = await getTimezones();

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row justify-between">
        <div className="flex flex-col sm:flex-col-reverse xl:flex-row gap-4">
          {activeTab === "daily" && <SpecificDatePicker />}
          {activeTab === "weekly" && <WeeklyDatePicker />}
          {activeTab === "monthly" && <MonthPicker />}

          <div className="flex gap-3">
            <SelectTimezoneDropDown timezones={timezones} />
            <SelectProjectWrapper />
          </div>
        </div>
        <SelectUserWrapper />
      </div>

      {activeTab === "daily" && (
        <Suspense fallback={<DailyTimeSheetsSkeleton />}>
          <DailyTimeSheetsServer searchParams={searchParams} />
        </Suspense>
      )}

      {activeTab === "weekly" && (
        <Suspense fallback={<WeeklyTimeSheetsSkeleton />}>
          <WeeklyTimeSheetsServer searchParams={searchParams} />
        </Suspense>
      )}

      {activeTab === "monthly" && (
        <Suspense fallback={<MonthlyTimeSheetsCalendarSkeleton />}>
          <MonthlyTimeSheetsServer searchParams={searchParams} />
        </Suspense>
      )}

    </div>
  );
};

export default AllTimesheetServer;
