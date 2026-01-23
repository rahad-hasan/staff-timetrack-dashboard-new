import HeadingComponent from "@/components/Common/HeadingComponent";
import DayWeekMonthSelection from "@/components/Common/DayWeekMonthSelection";
import AllTimesheetServer from "@/components/TimeSheets/AllTimesheets/AllTimesheetServer";
import { ISearchParamsProps } from "@/types/type";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Staff Time Tracker Timesheets",
    description: "Staff Time Tracker Timesheets",
};

const AllTimeSheets = ({ searchParams }: ISearchParamsProps) => {


    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="All Timesheets" subHeading="All the timesheet by team member who completed is displayed here"></HeadingComponent>
                <Suspense fallback={null}>
                    <DayWeekMonthSelection ></DayWeekMonthSelection>
                </Suspense>
            </div>

            <AllTimesheetServer searchParams={searchParams} />

        </div>
    );
};

export default AllTimeSheets;
