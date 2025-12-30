"use client"
import { Suspense, useState } from "react";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import TotalHoursPerDayChart from "@/components/Report/TimeAndActivities/TotalHoursPerDayChart";
import TimeAndActivitiesTable from "@/components/Report/TimeAndActivities/TimeAndActivitiesTable";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
// import TimeAndActivitiesTableSkeleton from "@/skeleton/report/timeAndActivities/TimeAndActivitiesTableSkeleton";

const TimeAndActivitiesPage = () => {

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="Time & activities" subHeading="All the Time & activities during the working hour by team member is here"></HeadingComponent>

            </div>
            <Suspense fallback={null}>
                <div className=" flex items-center justify-between">
                    <div className=" w-full flex flex-col sm:flex-row gap-4 sm:gap-4">
                        <SpecificDatePicker></SpecificDatePicker>
                        <SelectProjectDropDown></SelectProjectDropDown>
                    </div>
                </div>
            </Suspense>
            <div className="mt-4 flex items-stretch gap-3 sm:gap-6 max-w-[600px]">
                <div className="border border-borderColor dark:border-darkBorder rounded-xl w-full flex flex-col justify-between">
                    <div className="flex items-center justify-center py-6 bg-[#eff7fe] border-b border-borderColor dark:border-darkBorder rounded-t-xl flex-1">
                        <h2 className=" text-2xl sm:text-3xl font-medium text-center dark:text-darkSecondaryBg">60:33:52</h2>
                    </div>
                    <div className="text-center py-2 font-medium text-subTextColor dark:text-darkTextPrimary dark:bg-darkPrimaryBg rounded-b-xl">
                        Worked Time
                    </div>
                </div>

                <div className="border border-borderColor dark:border-darkBorder rounded-xl w-full flex flex-col justify-between">
                    <div className="flex flex-col items-center justify-center py-6 bg-[#fff5db] border-b border-borderColor dark:border-darkBorder rounded-t-xl flex-1">
                        <div className=" w-25 sm:w-27 h-25 sm:h-27 rounded-full border-[6px] border-[#f5b400] flex items-center justify-center bg-[#fff5db]">
                            <span className=" text-xl sm:text-2xl font-medium text-gray-800 dark:text-darkSecondaryBg">50.12%</span>
                        </div>
                    </div>
                    <div className="text-center py-2 font-medium text-subTextColor dark:text-darkTextPrimary dark:bg-darkPrimaryBg rounded-b-xl">
                        Avg. Activity
                    </div>
                </div>
            </div>

            <TotalHoursPerDayChart></TotalHoursPerDayChart>
            <TimeAndActivitiesTable></TimeAndActivitiesTable>
            {/* <TimeAndActivitiesTableSkeleton></TimeAndActivitiesTableSkeleton> */}
        </div>
    );
};

export default TimeAndActivitiesPage;