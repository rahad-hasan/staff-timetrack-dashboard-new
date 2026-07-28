"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DailyTimeSheetsTable from "./DailyTimeSheetsTable";
import { formatTZDate, getTZDecimalHour } from "@/utils";
import { useSearchParams } from "next/navigation";
import { ITimeSheetEntry } from "@/types/type";
import TimeEntryTooltip from "@/components/Common/TimeEntryTooltip";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { useLogInUserStore } from "@/store/logInUserStore";
import { deleteTimeEntry } from "@/actions/report/action";
import { toast } from "sonner";

type TimezoneOption = {
  value: string;
  label: string;
};

type ActivePeriod = {
  id: number;
  timeEntryId: number;
  start: number;
  end: number;
  startTime: string;
  endTime: string;
  project: string;
  task: string;
  notes?: string;
  duration: string;
  is_manual_entry: boolean;
  isManual: boolean;
};

const DailyTimeSheets = ({
  data,
  timeLineData,
  selectedDate,
  timezones,
}: {
  data: any;
  timeLineData: ITimeSheetEntry[];
  selectedDate: string | number | string[] | undefined;
  timezones: { data: TimezoneOption[]; defaultValue: string };
}) => {
  const logInUserData = useLogInUserStore((state) => state.logInUserData);
  const searchParams = useSearchParams();
  const selectedTimeZone = searchParams.get("timezone");
  const currentTimeZone = selectedTimeZone
    ? selectedTimeZone
    : timezones?.defaultValue;

  const handleDeleteManualTimeEntry = async (timeEntryId: number) => {
    try {
      const res = await deleteTimeEntry(timeEntryId);

      if (res?.success) {
        toast.success(res?.message || `Delete timeline successfully`);
      } else {
        toast.error(res?.message || `Failed to delete timeline`, {
          style: {
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
          },
        });
      }
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong!", {
        style: {
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
        },
      });
    }
  };

  // Transform backend data into activePeriods
  const activePeriods: ActivePeriod[] = (timeLineData || []).map((entry) => {
    const isManualEntry = Boolean(entry?.timeEntry?.is_manual_entry);

    return {
      id: entry.id,
      timeEntryId: entry?.timeEntry?.id ?? entry?.time_entries_id ?? entry.id,
      start: entry.start,
      end: entry.end,
      startTime: entry.format_start_time,
      endTime: entry.format_end_time,
      project: entry.project?.name || "No Project",
      task: entry.task?.name || "No Task",
      notes: entry.notes,
      duration: entry.format_duration,
      is_manual_entry: isManualEntry,
      isManual: isManualEntry,
    };
  });

  // 2. Logic for Day Progress Line
  const getDayProgressPercentage = () => {
    const now = new Date();
    const todayString = formatTZDate(now, currentTimeZone); // Match selectedDate format using TZ

    if (selectedDate !== todayString) {
      return selectedDate! < todayString ? 100 : 0;
    }

    // Get the current decimal hour in the user's timezone
    const decimalHourNow = getTZDecimalHour(now, currentTimeZone);
    return (decimalHourNow / 24) * 100;
  };

  const isToday = selectedDate === formatTZDate(new Date(), currentTimeZone);

  const dayProgress = getDayProgressPercentage();

  return (
    <>
      <div className="mb-5">
        <div className="flex gap-2 mb-2">
          <h1 className="font-bold text-headingTextColor dark:text-darkTextPrimary">
            Today:
          </h1>
          <p className="text-headingTextColor dark:text-darkTextPrimary">
            {data?.totals?.duration_formatted}
          </p>
        </div>
        <div
          className={`relative h-5 ${isToday ? "bg-borderColor" : "bg-bgSecondary"}  dark:bg-darkPrimaryBg rounded-4xl outline outline-borderColor dark:outline-darkBorder`}
        >
          {isToday && (
            <p
              className="absolute h-5 bg-bgSecondary dark:bg-darkSecondaryBg rounded-l-4xl border-r-3 border-[#bdbfbe] dark:border-[#afafaf]"
              style={{
                left: `0%`,
                width: `${dayProgress}%`,
              }}
            ></p>
          )}

          {activePeriods?.map((period, index: number) => {
            const startPercent = (period.start / 24) * 100;
            const endPercent = (period.end / 24) * 100;
            const width = endPercent - startPercent;
            const periodClassName = `absolute h-5 ${
              period?.is_manual_entry ? "bg-amber-400" : "bg-primary"
            } rounded-4xl z-50`;
            const periodStyle = {
              left: `${startPercent}%`,
              width: `${width}%`,
            };

            return (
              <Tooltip key={period.timeEntryId ?? index}>
                {period?.is_manual_entry && logInUserData?.role === "admin" ? (
                  <ConfirmDialog
                    trigger={
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={`${periodClassName} cursor-pointer border-0 p-0 focus-visible:outline focus-visible:outline-amber-500`}
                          style={periodStyle}
                          aria-label={`Delete manual time entry for ${period.project}`}
                        ></button>
                      </TooltipTrigger>
                    }
                    title="Delete manual time entry"
                    description="Are you sure you want to delete this manual time entry? This action cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={() => handleDeleteManualTimeEntry(period.id)}
                  />
                ) : (
                  <TooltipTrigger asChild>
                    <div className={periodClassName} style={periodStyle}></div>
                  </TooltipTrigger>
                )}
                <TooltipContent className="p-0">
                  <TimeEntryTooltip entry={period} />
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="flex justify-between mt-0.5">
          {Array.from({ length: 24 }, (_, i) => {
            const hour = i + 1;
            // choose which hours to always show
            const isAlwaysVisible =
              hour === 1 ||
              hour === 6 ||
              hour === 12 ||
              hour === 18 ||
              hour === 24;

            return (
              <span
                key={i}
                className={`text-sm text-gray-400 dark:text-darkTextSecondary
                   ${!isAlwaysVisible ? "hidden lg:inline xl:inline" : ""}
                   sm:first:ml-1
                `}
              >
                {hour}h
              </span>
            );
          })}
        </div>
      </div>
      <DailyTimeSheetsTable data={data?.items}></DailyTimeSheetsTable>
    </>
  );
};

export default DailyTimeSheets;
