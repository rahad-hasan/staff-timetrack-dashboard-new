import { ISearchParamsProps } from "@/types/type";
import DailyTimeSheetsServer from "./DailyTimeSheets/DailyTimeSheetsServer";
import { Suspense } from "react";
import DailyTimeSheetsSkeleton from "@/skeleton/timesheets/allTimesheets/DailyTimeSheetsSkeleton";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import MonthPicker from "@/components/Common/MonthPicker";
import MonthlyTimeSheetsServer from "./MonthlyTimeSheets/MonthlyTimeSheetsServer";
import MonthlyTimeSheetsCalendarSkeleton from "@/skeleton/timesheets/allTimesheets/MonthlyTimeSheetsCalendarSkeleton";
import WeeklyDatePicker from "@/components/Common/WeeklyDatePicker";
import WeeklyTimeSheetsServer from "./WeeklyTimeSheets/WeeklyTimeSheetsServer";
import WeeklyTimeSheetsSkeleton from "@/skeleton/timesheets/allTimesheets/WeeklyTimeSheetsSkeleton";
import { getMembersDashboard } from "@/actions/members/action";
import SelectProjectWrapper from "@/components/Common/SelectProjectWrapper";

const AllTimesheetServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  type Tab = "daily" | "weekly" | "monthly";
  const activeTab = (params?.tab as Tab) ?? "daily";

  const res = await getMembersDashboard();

  const users = res.data.map((u) => ({
    id: String(u.id),
    label: u.name,
    avatar: u.image || "",
  }));

  return (
    <div>
      {activeTab === "daily" && (
        <>
          <div className=" mb-5 flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between h-full">
            <div className=" flex flex-col sm:flex-col-reverse xl:flex-row gap-4 md:gap-3">
              <SpecificDatePicker></SpecificDatePicker>
              <SelectProjectWrapper></SelectProjectWrapper>
            </div>
            <SelectUserDropDown users={users} />
          </div>
          <Suspense fallback={<DailyTimeSheetsSkeleton />}>
            <DailyTimeSheetsServer searchParams={searchParams} />
          </Suspense>
        </>
      )}

      {activeTab === "weekly" && (
        <>
          <div className=" mb-5 flex flex-col gap-4 xl:gap-0 xl:flex-row justify-between">
            <div className=" flex gap-3">
              <WeeklyDatePicker />
              <div className=" hidden md:block">
                {/* <Button className="dark:text-darkTextPrimary" variant={'filter'}>
                                <SlidersHorizontal className=" dark:text-darkTextPrimary" /> Filters
                                </Button> */}
                <SelectProjectWrapper></SelectProjectWrapper>
              </div>
            </div>
            <SelectUserDropDown users={users} />
          </div>
          <Suspense fallback={<WeeklyTimeSheetsSkeleton />}>
            <WeeklyTimeSheetsServer
              searchParams={searchParams}
            ></WeeklyTimeSheetsServer>
          </Suspense>
        </>
      )}

      {activeTab === "monthly" && (
        <>
          <div className=" mb-5 flex flex-col gap-4 md:gap-0 sm:flex-row justify-between">
            <div className="flex gap-3">
              <MonthPicker></MonthPicker>
              <div className=" hidden md:block h-full">
                <SelectProjectWrapper></SelectProjectWrapper>
              </div>
            </div>
            <SelectUserDropDown users={users} />
          </div>
          <Suspense fallback={<MonthlyTimeSheetsCalendarSkeleton />}>
            {
              <MonthlyTimeSheetsServer
                searchParams={searchParams}
              ></MonthlyTimeSheetsServer>
            }
          </Suspense>
        </>
      )}
    </div>
  );
};

export default AllTimesheetServer;
