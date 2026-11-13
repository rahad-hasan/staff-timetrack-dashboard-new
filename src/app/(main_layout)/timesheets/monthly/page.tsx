import HeadingComponent from "@/components/Common/HeadingComponent";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";
import LiveRefresh from "@/components/Common/LiveRefresh";
import MonthPicker from "@/components/Common/MonthPicker";
import SelectProjectWrapper from "@/components/Common/SelectProjectWrapper";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import MonthlyTimeSheetsServer from "@/components/TimeSheets/AllTimesheets/MonthlyTimeSheets/MonthlyTimeSheetsServer";
import TimezoneFilter, {
    TimezoneFilterFallback,
} from "@/components/TimeSheets/TimezoneFilter";
import MonthlyTimeSheetsCalendarSkeleton from "@/skeleton/timesheets/allTimesheets/MonthlyTimeSheetsCalendarSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Monthly Timesheets",
    description: "Staff Time Tracker Monthly Timesheets",
};
const MonthlyTimeSheets = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;

    return (
        <div className=" space-y-5">
            <LiveRefresh section="timesheets" />
            <HeadingComponent
                heading="All Timesheets"
                subHeading="All the timesheet by team member who completed is displayed here"
            ></HeadingComponent>
            {/* A boundary of its own, as on every live page: it hydrates after
                the rest of the page, so nothing in the filters can start a
                server action before a sheet whose read failed has been caught.
                The pickers' mount-time reads once did, and Next's router
                crashed the whole page (React #310). */}
            <Suspense fallback={null}>
                <div className="flex flex-col gap-4 xl:flex-row justify-between">
                    <div className="flex flex-col sm:flex-col-reverse xl:flex-row gap-4">
                        <MonthPicker />
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
                key={`monthly-${params.start_month}-${params.end_month}`}
                fallback={<MonthlyTimeSheetsCalendarSkeleton />}
            >
                <LiveDataBoundary>
                    <MonthlyTimeSheetsServer searchParams={searchParams} />
                </LiveDataBoundary>
            </Suspense>
        </div>
    );
};

export default MonthlyTimeSheets;
