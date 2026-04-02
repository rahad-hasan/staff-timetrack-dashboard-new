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

type TimezoneOption = {
  value: string;
  label: string;
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
  const searchParams = useSearchParams();
  const selectedTimeZone = searchParams.get("timezone");
  const currentTimeZone = selectedTimeZone
    ? selectedTimeZone
    : timezones?.defaultValue;

  // Transform backend data into activePeriods
  const activePeriods = (timeLineData || []).map((entry) => ({
    id: entry.id,
    start: entry.start,
    end: entry.end,
    startTime: entry.format_start_time,
    endTime: entry.format_end_time,
    project: entry.project?.name || "No Project",
    task: entry.task?.name || "No Task",
    notes: entry.notes,
    duration: entry.format_duration,
    is_manual_entry: entry?.timeEntry?.is_manual_entry,
  }));

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
          className={`relative h-5 ${isToday ? "bg-[#dce3e3]" : "bg-[#f6f7f9]"}  dark:bg-darkPrimaryBg rounded-4xl outline outline-borderColor dark:outline-darkBorder`}
        >
          {isToday && (
            <p
              className="absolute h-5 bg-[#f6f7f9] dark:bg-darkSecondaryBg rounded-l-4xl border-r-3 border-[#bdbfbe] dark:border-[#afafaf]"
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

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    key={index}
                    className={`absolute h-5 ${period?.is_manual_entry ? "bg-amber-400" : "bg-primary"} rounded-4xl z-50`}
                    style={{
                      left: `${startPercent}%`,
                      width: `${width}%`,
                    }}
                  ></div>
                </TooltipTrigger>
                <TooltipContent className="p-0">
                  <TimeEntryTooltip entry={period} />
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="flex justify-between mt-[2px]">
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
