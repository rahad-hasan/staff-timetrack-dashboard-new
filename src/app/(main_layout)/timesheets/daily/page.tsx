import HeadingComponent from "@/components/Common/HeadingComponent";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";
import LiveRefresh from "@/components/Common/LiveRefresh";
import SelectProjectWrapper from "@/components/Common/SelectProjectWrapper";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import DailyTimeSheetsServer from "@/components/TimeSheets/AllTimesheets/DailyTimeSheets/DailyTimeSheetsServer";
import TimezoneFilter, {
  TimezoneFilterFallback,
} from "@/components/TimeSheets/TimezoneFilter";
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

  return (
    <div className="space-y-5">
      <LiveRefresh section="timesheets" />
      <HeadingComponent
        heading="All Timesheets"
        subHeading="All the timesheet by team member who completed is displayed here"
      ></HeadingComponent>
      {/* A boundary of its own, as on every live page: it hydrates after the
          rest of the page, so nothing in the filters can start a server action
          before a sheet whose read failed has been caught. The pickers'
          mount-time reads once did, and Next's router crashed the whole page
          (React #310). */}
      <Suspense fallback={null}>
        <div className="flex flex-col gap-4 xl:flex-row justify-between">
          <div className="flex flex-col sm:flex-col-reverse xl:flex-row gap-4">
            <SpecificDatePicker />
            <div className="flex gap-3">
              <Suspense fallback={<TimezoneFilterFallback />}>
                <TimezoneFilter />
              </Suspense>
              <SelectProjectWrapper />
            </div>
          </div>
          <SelectUserWrapper />
        </div>
      </Suspense>

      <Suspense
        key={JSON.stringify(params)}
        fallback={<DailyTimeSheetsSkeleton />}
      >
        <LiveDataBoundary>
          <DailyTimeSheetsServer searchParams={searchParams} />
        </LiveDataBoundary>
      </Suspense>
    </div>
  );
};

export default DailyTimeSheets;
