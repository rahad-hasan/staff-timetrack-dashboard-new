import { getTimezones } from "@/actions/dashboard/action";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectProjectWrapper from "@/components/Common/SelectProjectWrapper";
import SelectTimezoneDropDown from "@/components/Common/SelectTimezoneDropDown";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import WeeklyDatePicker from "@/components/Common/WeeklyDatePicker";
import WeeklyRangeTimesheetServer from "@/components/Report/TimeSheets/WeeklyRangeTimesheetServer";
import WeeklyTimeSheetsServer from "@/components/TimeSheets/AllTimesheets/WeeklyTimeSheets/WeeklyTimeSheetsServer";
import WeekRangeTabs from "@/components/TimeSheets/AllTimesheets/WeeklyTimeSheets/WeekRangeTabs";
import WeeklyTimeSheetsSkeleton from "@/skeleton/timesheets/allTimesheets/WeeklyTimeSheetsSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Daily Timesheets",
    description: "Staff Time Tracker Daily Timesheets",
};

const WeeklyTimeSheets = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const activeTab = (params?.tab) ?? "weekly";
    const timezones = await getTimezones();

    return (
        <div className=" space-y-5">
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
                    <div className="flex flex-col gap-4 xl:flex-row justify-between">
                        <div className="flex flex-col sm:flex-col-reverse xl:flex-row gap-4">
                            <WeeklyDatePicker />
                            <div className="flex gap-3">
                                <SelectTimezoneDropDown timezones={timezones} />
                                <SelectProjectWrapper />
                            </div>
                        </div>
                        <SelectUserWrapper />
                    </div>
                    <Suspense
                        key={`weekly-${params.from_date}-${params.to_date}`}
                        fallback={<WeeklyTimeSheetsSkeleton />}
                    >
                        <WeeklyTimeSheetsServer searchParams={searchParams} />
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