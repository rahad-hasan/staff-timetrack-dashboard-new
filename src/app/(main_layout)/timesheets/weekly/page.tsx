import HeadingComponent from "@/components/Common/HeadingComponent";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";
import LiveRefresh from "@/components/Common/LiveRefresh";
import SelectProjectWrapper from "@/components/Common/SelectProjectWrapper";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import WeeklyDatePicker from "@/components/Common/WeeklyDatePicker";
import WeeklyRangeTimesheetServer from "@/components/Report/TimeSheets/WeeklyRangeTimesheetServer";
import TimezoneFilter, {
    TimezoneFilterFallback,
} from "@/components/TimeSheets/TimezoneFilter";
import WeeklyTimeSheetsServer from "@/components/TimeSheets/AllTimesheets/WeeklyTimeSheets/WeeklyTimeSheetsServer";
import WeekRangeTabs from "@/components/TimeSheets/AllTimesheets/WeeklyTimeSheets/WeekRangeTabs";
import WeeklyTimeSheetsSkeleton from "@/skeleton/timesheets/allTimesheets/WeeklyTimeSheetsSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Weekly Timesheets",
    description: "Staff Time Tracker Weekly Timesheets",
};

const WeeklyTimeSheets = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const activeTab = (params?.tab) ?? "weekly";

    return (
        <div className=" space-y-5">
            <LiveRefresh section="timesheets" />
            <div className="flex items-center justify-between">
                <HeadingComponent
                    heading="All Timesheets"
                    subHeading="All the timesheet by team member who completed is displayed here"
                ></HeadingComponent>
                <Suspense fallback={null}>
                    <WeekRangeTabs></WeekRangeTabs>
                </Suspense>
            </div>

            {
                activeTab === "weekly" &&
                <div className=" space-y-5">
                    {/* A boundary of its own, as on every live page: it
                        hydrates after the rest of the page, so nothing in the
                        filters can start a server action before a sheet whose
                        read failed has been caught. The pickers' mount-time
                        reads once did, and Next's router crashed the whole page
                        (React #310). The range tab's pickers sit in its
                        boundary below. */}
                    <Suspense fallback={null}>
                        <div className="flex flex-col gap-4 xl:flex-row justify-between">
                            <div className="flex flex-col sm:flex-col-reverse xl:flex-row gap-4">
                                <WeeklyDatePicker />
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
                        key={`weekly-${params.from_date}-${params.to_date}`}
                        fallback={<WeeklyTimeSheetsSkeleton />}
                    >
                        <LiveDataBoundary>
                            <WeeklyTimeSheetsServer searchParams={searchParams} />
                        </LiveDataBoundary>
                    </Suspense>
                </div>
            }

            {
                activeTab === "range" &&
                <Suspense
                    key={`weekly-${params.from_date}-${params.to_date}`}
                    fallback={<WeeklyTimeSheetsSkeleton />}
                >
                    <WeeklyRangeTimesheetServer searchParams={searchParams} />
                </Suspense>
            }

        </div>
    );
};

export default WeeklyTimeSheets;
