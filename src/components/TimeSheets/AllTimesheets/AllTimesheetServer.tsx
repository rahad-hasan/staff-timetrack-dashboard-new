import { ISearchParamsProps } from "@/types/type";
import MonthlyTimeSheets from "./MonthlyTimeSheets/MonthlyTimeSheets";
import WeeklyTimeSheets from "./WeeklyTimeSheets/WeeklyTimeSheets";
import DailyTimeSheetsServer from "./DailyTimeSheets/DailyTimeSheetsServer";
import { Suspense } from "react";
import DailyTimeSheetsSkeleton from "@/skeleton/timesheets/allTimesheets/DailyTimeSheetsSkeleton";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";

const AllTimesheetServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    type Tab = "daily" | "weekly" | "monthly";
    const activeTab = (params?.tab as Tab) ?? "daily";

    return (
        <div>
            {
                activeTab === "daily" &&
                <>
                    <div className=" mb-5 flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between h-full">
                        <div className=" flex flex-col sm:flex-col-reverse xl:flex-row gap-4 md:gap-3">
                            <SpecificDatePicker></SpecificDatePicker>
                            <SelectProjectDropDown></SelectProjectDropDown>
                        </div>
                        <SelectUserDropDown></SelectUserDropDown>
                    </div>
                    <Suspense fallback={<DailyTimeSheetsSkeleton />}>
                        <DailyTimeSheetsServer searchParams={searchParams} />
                    </Suspense>
                </>
            }

            {
                activeTab === "weekly" &&
                <WeeklyTimeSheets></WeeklyTimeSheets>
            }

            {
                activeTab === "monthly" &&
                <MonthlyTimeSheets></MonthlyTimeSheets>
            }
        </div>
    );
};

export default AllTimesheetServer;