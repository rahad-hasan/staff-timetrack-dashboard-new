"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IDailyReportResponse, TLeaveType } from "@/types/type";
import { getDay, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import EmptyTableLogo from "@/assets/empty_table.svg";

function getTextColor(HMS: string, leave_type: TLeaveType) {
  if (
    HMS.split(":")?.reduce((acc, cur) => acc + Number(cur), 0) > 0 &&
    !leave_type
  ) {
    return "text-primary";
  } else if (leave_type) {
    return "text-primary/60";
  } else {
    return "text-primary/30";
  }
}

// Module scope on purpose: declared inside the calendar, every render (e.g.
// switching Hours/Activity) created new component types, so React unmounted
// and remounted all ~40 cells and their links instead of updating them.
const DateCell = ({
  viewType,
  userId,
  dayFilters,
  dateString,
  dayNumber,
  formattedTime,
  activity, // Changed from duration to match new data key
  isPadding,
  leave_type,
  is_manual_entry,
  is_manual_entry_approved,
}: {
  viewType: string;
  /** Whose day the cell links to. */
  userId: string;
  /** The month's project / zone filters as `&…`, for the daily link ("" without any). */
  dayFilters: string;
  dateString?: string;
  dayNumber?: number;
  formattedTime?: string;
  activity?: number;
  isPadding?: boolean;
  leave_type?: TLeaveType;
  is_manual_entry?: boolean;
  is_manual_entry_approved?: boolean;
}) => {
  const content = (
    <div
      className={`hover:bg-slate-500/5 relative p-3 h-28 md:h-24 flex flex-col justify-center items-center border text-headingTextColor dark:text-darkTextPrimary ${leave_type ? "border-yellow-300/70 dark:border-yellow-300/50" : "border-gray-200 dark:border-darkBorder"}`}
    >
      {is_manual_entry && (
        <div
          className={`w-2.5 h-2.5 rounded-full absolute left-1 top-1 ${is_manual_entry_approved ? "bg-green-600" : "bg-amber-600 animate-pulse"}`}
        ></div>
      )}
      {/* Render nothing for padding cells to keep your original layout empty */}
      {!isPadding && (
        <>
          <span className="font-thin text-lg mb-1 text-headingTextColor/60 dark:text-darkTextSecondary/70">
            {dayNumber}
          </span>
          {viewType === "Hours" ? (
            <div>
              {formattedTime && (
                <div
                  className={`px-2 py-1 text-sm font-medium ${getTextColor(formattedTime, leave_type as TLeaveType)}`}
                >
                  {leave_type ? leave_type + " leave" : formattedTime}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Using 'activity' from new data format */}
              <div
                className={`w-fit px-3 text-center py-1 text-sm font-medium bg-gray-50 rounded-lg dark:bg-gray-900/25 ${leave_type ? "text-primary/60" : "text-primary"}`}
              >
                {leave_type ? leave_type + " leave" : `${activity || 0}%`}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return is_manual_entry && !is_manual_entry_approved ? (
    <Link
      href={`/timesheets/manual-requests?user_id=${userId}&date=${dateString}`}
    >
      {content}
    </Link>
  ) : formattedTime === "00:00:00" || isPadding ? (
    content
  ) : (
    <Link
      href={`/timesheets/daily?user_id=${userId}&date=${dateString}${dayFilters}`}
    >
      {content}
    </Link>
  );
};

const DayHeader = ({ day, className }: { day: string; className?: string }) => (
  <div
    className={`p-3 flex items-center justify-center font-bold text-sm h-14 bg-bgSecondary  dark:bg-darkSecondaryBg text-headingTextColor dark:text-darkTextPrimary ${className}`}
  >
    {day}
  </div>
);

const MonthlyTimeSheetsCalendar = ({
  logInUserId,
  data,
  message,
}: {
  logInUserId: number | undefined;
  data: IDailyReportResponse;
  /** Shown in place of the empty-month text: why the API refused the read. */
  message?: string;
}) => {
  const searchParams = useSearchParams();

  const userId = searchParams.get("user_id");
  const linkUserId = userId || String(logInUserId);

  // A day opened from its cell keeps the filters the cell's hours were read
  // under: the month honours ?project_id and ?timezone, and the daily sheet
  // without them showed a different total for the same day. Only on the
  // daily link: the manual-requests list ignores the zone, and a project
  // there would narrow an approval queue.
  const carried = new URLSearchParams();
  const projectId = searchParams.get("project_id");
  const timeZone = searchParams.get("timezone");
  if (projectId) carried.set("project_id", projectId);
  if (timeZone) carried.set("timezone", timeZone);
  const dayFilters = projectId || timeZone ? `&${carried.toString()}` : "";

  const [viewType, setViewType] = useState("Hours");

  // 1. Process the new "daily_data" array format
  const dailyData = data?.daily_data || [];

  const getPaddingCells = () => {
    if (dailyData.length === 0) return [];
    // Get the first date from the new array structure
    const firstDate = parseISO(dailyData[0].date);
    const dayOfWeek = getDay(firstDate); // 0 (Sun) to 6 (Sat)

    // Adjust for Monday start: Mon=0, Tue=1 ... Sun=6
    const paddingCount = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return Array(paddingCount).fill(null);
  };

  const paddingCells = getPaddingCells();
  const dayHeaders = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  // A refused read has no month to draw: say why, as the weekly sheet does,
  // instead of blank totals over an empty grid.
  if (!data) {
    return (
      <div className="py-16 flex flex-col items-center justify-between gap-4">
        <Image
          src={EmptyTableLogo}
          alt="table empty"
          width={120}
          height={120}
        />
        <p className="text-lg">
          {message || "No data available for this month."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className=" mb-5 flex flex-col gap-4 md:gap-0 md:flex-row justify-between">
        <div className=" flex items-center gap-3 md:gap-5 ">
          <div className=" flex items-center gap-0.5 md:gap-2">
            <h2 className=" font-medium text-headingTextColor dark:text-darkTextPrimary">
              Total Hour:
            </h2>
            <h2 className="text-headingTextColor dark:text-darkTextPrimary">
              {data?.total_time}
            </h2>
          </div>
          <div className=" flex items-center gap-0.5 md:gap-2">
            <h2 className=" font-medium text-headingTextColor dark:text-darkTextPrimary">
              Monthly Activity:
            </h2>
            <h2 className="text-headingTextColor dark:text-darkTextPrimary">
              {data?.activity}%
            </h2>
          </div>
        </div>
        <div className=" flex items-center gap-2 ">
          <p className=" font-medium text-headingTextColor dark:text-darkTextPrimary">
            Select Option:{" "}
          </p>
          <div className="  dark:bg-darkPrimaryBg rounded-lg">
            <Select
              onValueChange={(value) => setViewType(value)}
              defaultValue="Hours"
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select An Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup className=" dark:bg-darkSecondaryBg">
                  <SelectItem className=" cursor-pointer" value="Hours">
                    Hours
                  </SelectItem>
                  <SelectItem className=" cursor-pointer" value="Activity">
                    Activity
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className=" overflow-auto ">
        <div className="grid grid-cols-7 gap-2 min-w-[750px]">
          {/* Headers */}
          {dayHeaders.map((day, index) => {
            let extraClass = "";
            if (index === 0) extraClass = "rounded-tl-lg";
            if (index === dayHeaders.length - 1) extraClass = "rounded-tr-lg";

            return (
              <div key={day}>
                <DayHeader day={day} className={extraClass} />
              </div>
            );
          })}

          {/* Empty Padding Cells */}
          {paddingCells.map((_, index) => (
            <DateCell
              key={`pad-${index}`}
              viewType={viewType}
              userId={linkUserId}
              dayFilters={dayFilters}
              isPadding={true}
            />
          ))}

          {/* Mapping through new daily_data array */}
          {dailyData?.map((dayItem) => {
            const dateObj = parseISO(dayItem?.date);
            return (
              <DateCell
                key={dayItem?.date}
                viewType={viewType}
                userId={linkUserId}
                dayFilters={dayFilters}
                dateString={dayItem?.date}
                dayNumber={dateObj.getDate()}
                formattedTime={dayItem?.duration}
                activity={dayItem?.activity}
                leave_type={dayItem.leave_type}
                is_manual_entry={dayItem.is_manual_entry}
                is_manual_entry_approved={dayItem.is_manual_entry_approved}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthlyTimeSheetsCalendar;
