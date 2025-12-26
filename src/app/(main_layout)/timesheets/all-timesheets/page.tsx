import HeadingComponent from "@/components/Common/HeadingComponent";
import DayWeekMonthSelection from "@/components/Common/DayWeekMonthSelection";
import AllTimesheetServer from "@/components/TimeSheets/AllTimesheets/AllTimesheetServer";
import { ISearchParamsProps } from "@/types/type";


const AllTimeSheets = ({ searchParams }: ISearchParamsProps) => {

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="All Timesheets" subHeading="All the timesheet by team member who completed is displayed here"></HeadingComponent>

                <DayWeekMonthSelection ></DayWeekMonthSelection>
            </div>
            <AllTimesheetServer searchParams={searchParams} />
            {/* {
                activeTab === "Monthly" &&
                <MonthlyTimeSheetsCalendarSkeleton></MonthlyTimeSheetsCalendarSkeleton>
            } */}

        </div>
    );
};

export default AllTimeSheets;
