import { getMembersDashboard } from "@/actions/members/action";
import DayWeekMonthSelection from "@/components/Common/DayWeekMonthSelection";
import HeadingComponent from "@/components/Common/HeadingComponent";
import MonthPicker from "@/components/Common/MonthPicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import WeeklyDatePicker from "@/components/Common/WeeklyDatePicker";
import DayWeekMonthSelectionServer from "@/components/Report/TimeSheets/DayWeekMonthSelectionServer";
import ReportMonthlyTimeSheetServer from "@/components/Report/TimeSheets/ReportMonthlyTimeSheetServer";
import ReportWeeklyTimeSheetServer from "@/components/Report/TimeSheets/ReportWeeklyTimeSheetServer";
import ReportMonthlyTimesheetSkeleton from "@/skeleton/report/Timesheet/ReportMonthlyTimesheetSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Staff Time Tracker Report Timesheets",
  description: "Staff Time Tracker Report Timesheets",
};
const ReportTimeSheets = async ({ searchParams }: ISearchParamsProps) => {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
        <HeadingComponent
          heading="All Timesheets"
          subHeading="All the timesheet by team member who completed is displayed here"
        ></HeadingComponent>
        <DayWeekMonthSelection></DayWeekMonthSelection>
      </div>

      {activeTab === "daily" && (
        <>
          <div className="mb-5 flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between">
            <SpecificDatePicker></SpecificDatePicker>
            <SelectUserDropDown users={users}></SelectUserDropDown>
          </div>

          <DayWeekMonthSelectionServer
            searchParams={searchParams}
          ></DayWeekMonthSelectionServer>
        </>
      )}

      {activeTab === "weekly" && (
        <>
          <div className="mb-5 flex flex-col gap-4 lg:gap-0 lg:flex-row justify-between">
            <div className=" flex gap-3">
              <WeeklyDatePicker />
              {/* <Button className=" hidden sm:flex text-headingTextColor dark:text-darkTextPrimary" variant={'filter'}>
                        <SlidersHorizontal className="text-headingTextColor dark:text-darkTextPrimary" /> Filters
                    </Button> */}
            </div>
            <SelectUserDropDown users={users}></SelectUserDropDown>
          </div>
          <ReportWeeklyTimeSheetServer
            searchParams={searchParams}
          ></ReportWeeklyTimeSheetServer>

        </>
      )}

      {activeTab === "monthly" && (
        <>
          <div className="mb-5 flex flex-col gap-4 md:gap-0 md:flex-row justify-between">
            <MonthPicker />
            <SelectUserDropDown users={users} />
          </div>
          <Suspense fallback={<ReportMonthlyTimesheetSkeleton />}>
            {params.start_month && params.end_month ? (
              <ReportMonthlyTimeSheetServer
                searchParams={searchParams}
              ></ReportMonthlyTimeSheetServer>
            ) : (
              <ReportMonthlyTimesheetSkeleton></ReportMonthlyTimesheetSkeleton>
            )}
          </Suspense>
        </>
      )}
    </div>
  );
};

export default ReportTimeSheets;
