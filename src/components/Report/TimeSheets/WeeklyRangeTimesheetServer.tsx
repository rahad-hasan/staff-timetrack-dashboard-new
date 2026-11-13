import { getDateBaseTimeEntry } from "@/actions/report/action";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";
import SelectDateRange from "@/components/Common/SelectDateRange";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import ReportWeeklyTimeSheet from "@/components/Report/TimeSheets/ReportWeeklyTimeSheet";
import TimezoneFilter, {
    TimezoneFilterFallback,
} from "@/components/TimeSheets/TimezoneFilter";
import { resolveViewFilters } from "@/components/TimeSheets/viewFilters";
import { requireDataOrRefusal } from "@/lib/server/liveData";
import { ISearchParamsProps } from "@/types/type";
import { addDays, format, parseISO } from "date-fns";
import { Suspense } from "react";

const WeeklyRangeTimesheetServer = ({ searchParams }: ISearchParamsProps) => {
    return (
        <div className=" space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row justify-between">
                <div className="flex flex-col sm:flex-col-reverse xl:flex-row gap-4">
                    <SelectDateRange />
                    <div className="flex gap-3">
                        <Suspense fallback={<TimezoneFilterFallback />}>
                            <TimezoneFilter />
                        </Suspense>
                    </div>
                </div>
                <SelectUserWrapper />
            </div>
            {/* The read lives below the filters, so a failure replaces the
                sheet and leaves the range and user pickers usable. */}
            <LiveDataBoundary>
                <WeeklyRangeSheet searchParams={searchParams} />
            </LiveDataBoundary>
        </div>
    );
};

const WeeklyRangeSheet = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const { userId, today } = await resolveViewFilters(params);

    // Default range: the viewer's today and the six days after it.
    const weekEnd = format(addDays(parseISO(today), 6), "yyyy-MM-dd");

    const dateBasedTimeEntry = await getDateBaseTimeEntry({
        user_id: userId,
        from_date: params.from_date ?? today,
        to_date: params.to_date ?? weekEnd,
        timezone: params?.timezone,
    });
    // A refusal (no access to the member, no such member, a bad range) keeps
    // the empty sheet; any other failure throws.
    requireDataOrRefusal(dateBasedTimeEntry, "the timesheet range");

    return (
        <Suspense key={`weekly-${params.from_date}-${params.to_date}`}>
            <ReportWeeklyTimeSheet
                dateBasedTimeEntry={dateBasedTimeEntry}
            ></ReportWeeklyTimeSheet>
        </Suspense>
    );
};

export default WeeklyRangeTimesheetServer;
