import { getTimezones } from "@/actions/dashboard/action";
import HeadingComponent from "@/components/Common/HeadingComponent";
import MonthPicker from "@/components/Common/MonthPicker";
import SelectProjectWrapper from "@/components/Common/SelectProjectWrapper";
import SelectTimezoneDropDown from "@/components/Common/SelectTimezoneDropDown";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import MonthlyTimeSheetsServer from "@/components/TimeSheets/AllTimesheets/MonthlyTimeSheets/MonthlyTimeSheetsServer";
import MonthlyTimeSheetsCalendarSkeleton from "@/skeleton/timesheets/allTimesheets/MonthlyTimeSheetsCalendarSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Daily Timesheets",
    description: "Staff Time Tracker Daily Timesheets",
};
const MonthlyTimeSheets = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const timezones = await getTimezones();

    return (
        <div className=" space-y-5">
            <HeadingComponent
                heading="All Timesheets"
                subHeading="All the timesheet by team member who completed is displayed here"
            ></HeadingComponent>
            <div className="flex flex-col gap-4 xl:flex-row justify-between">
                <div className="flex flex-col sm:flex-col-reverse xl:flex-row gap-4">
                    <MonthPicker />
                    <div className="flex gap-3">
                        <SelectTimezoneDropDown timezones={timezones} />
                        <SelectProjectWrapper />
                    </div>
                </div>
                <SelectUserWrapper />
            </div>

            <Suspense
                key={`monthly-${params.start_month}-${params.end_month}`}
                fallback={<MonthlyTimeSheetsCalendarSkeleton />}
            >
                <MonthlyTimeSheetsServer searchParams={searchParams} />
            </Suspense>
        </div>
    );
};

export default MonthlyTimeSheets;