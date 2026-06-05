import { getTimezones } from "@/actions/dashboard/action";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectProjectWrapper from "@/components/Common/SelectProjectWrapper";
import SelectTimezoneDropDown from "@/components/Common/SelectTimezoneDropDown";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import DailyTimeSheetsServer from "@/components/TimeSheets/AllTimesheets/DailyTimeSheets/DailyTimeSheetsServer";
import DailyTimeSheetsSkeleton from "@/skeleton/timesheets/allTimesheets/DailyTimeSheetsSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Daily Timesheets",
  description: "Staff Time Tracker Daily Timesheets",
};
const DailyTimeSheets = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const timezones = await getTimezones();

  return (
    <div className="space-y-5">
      <HeadingComponent
        heading="All Timesheets"
        subHeading="All the timesheet by team member who completed is displayed here"
      ></HeadingComponent>
      <div className="flex flex-col gap-4 xl:flex-row justify-between">
        <div className="flex flex-col sm:flex-col-reverse xl:flex-row gap-4">
          <SpecificDatePicker />
          <div className="flex gap-3">
            <SelectTimezoneDropDown timezones={timezones} />
            <SelectProjectWrapper />
          </div>
        </div>
        <SelectUserWrapper />
      </div>

      <Suspense
        key={JSON.stringify(params)}
        fallback={<DailyTimeSheetsSkeleton />}
      >
        <DailyTimeSheetsServer
          searchParams={searchParams}
          timezones={timezones}
        />
      </Suspense>
    </div>
  );
};

export default DailyTimeSheets;