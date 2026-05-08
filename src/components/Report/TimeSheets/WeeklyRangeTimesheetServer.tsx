import { getTimezones } from "@/actions/dashboard/action";
import { getDateBaseTimeEntry } from "@/actions/report/action";
import SelectDateRange from "@/components/Common/SelectDateRange";
import SelectTimezoneDropDown from "@/components/Common/SelectTimezoneDropDown";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import ReportWeeklyTimeSheet from "@/components/Report/TimeSheets/ReportWeeklyTimeSheet";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { addDays, format } from "date-fns";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Staff Time Tracker Report Timesheets",
    description: "Staff Time Tracker Report Timesheets",
};

const WeeklyRangeTimesheetServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const user = await getDecodedUser();

    const now = new Date();
    const weekUnformattedEnd = addDays(now, 6)
    const weekStart = format(now, "yyyy-MM-dd");
    const weekEnd = format(weekUnformattedEnd, "yyyy-MM-dd");

    const dateBasedTimeEntry = await getDateBaseTimeEntry({
        user_id: params.user_id ?? user?.id,
        from_date: params.from_date ?? weekStart,
        to_date: params.to_date ?? weekEnd,
        timezone: params?.timezone,
    });
    const timezones = await getTimezones();

    return (
        <div className=" space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row justify-between">
                <div className="flex flex-col sm:flex-col-reverse xl:flex-row gap-4">
                    <SelectDateRange />
                    <div className="flex gap-3">
                        <SelectTimezoneDropDown timezones={timezones} />
                    </div>
                </div>
                <SelectUserWrapper />
            </div>
            <Suspense key={`weekly-${params.from_date}-${params.to_date}`}>
                <ReportWeeklyTimeSheet
                    dateBasedTimeEntry={dateBasedTimeEntry}
                ></ReportWeeklyTimeSheet>
            </Suspense>
        </div>
    );
};

export default WeeklyRangeTimesheetServer;
