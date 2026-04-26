"use client";

import { format, isSameMonth } from "date-fns";
import { CalendarDays, Sparkles } from "lucide-react";


import { LeaveCalendarDayItem, LeaveCalendarLeaveItem } from "@/types/type";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getLeaveStatusTheme, getLeaveTypeTheme } from "@/lib/leave";
import MonthPicker from "../Common/MonthPicker";

const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LeaveCalendarView = ({
  monthDate,
  days,
  canManageUsers = false,
  users = [],
}: {
  monthDate: Date;
  days: Record<string, LeaveCalendarDayItem[]>;
  canManageUsers?: boolean;
  users?: { id: string; label: string; avatar: string }[];
}) => {


  const calendarDays = (() => {
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const startPadding = start.getDay();
    const firstVisibleDay = new Date(start);
    firstVisibleDay.setDate(start.getDate() - startPadding);

    return Array.from({ length: 42 }).map((_, index) => {
      const date = new Date(firstVisibleDay);
      date.setDate(firstVisibleDay.getDate() + index);
      const dateKey = format(date, "yyyy-MM-dd");

      return { date, dateKey, dayItems: days[dateKey] ?? [] };
    });
  })();

  const leaveTypeLegend = Array.from(
    new Map(
      Object.values(days)
        .flat()
        .filter((item): item is LeaveCalendarLeaveItem => item.type === "leave")
        .map((item) => [
          `${item.title}-${item.color ?? ""}`,
          {
            title: item.title,
            color: item.color,
          },
        ]),
    ).values(),
  );
  const hasHolidays = Object.values(days)
    .flat()
    .some((item) => item.type === "holiday");



  const renderCalendarItemTooltip = (item: LeaveCalendarDayItem) => {
    if (item.type === "holiday") {
      return (
        <div className="w-72 space-y-3 text-headingTextColor dark:text-darkTextPrimary">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-subTextColor dark:text-darkTextPrimary/50">
              Holiday
            </p>
            <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
          </div>
          {item.description ? (
            <div>
              <p className="text-xs font-medium text-subTextColor dark:text-darkTextPrimary/50">Description</p>
              <p className="mt-1 text-sm leading-5">{item.description}</p>
            </div>
          ) : null}
          {item.source ? (
            <div>
              <p className="text-xs font-medium text-subTextColor dark:text-darkTextPrimary/50">Source</p>
              <p className="mt-1 text-sm capitalize">{item.source}</p>
            </div>
          ) : null}
        </div>
      );
    }

    const statusTheme = getLeaveStatusTheme(item.status);

    return (
      <div className="w-72 space-y-3 text-headingTextColor dark:text-darkTextPrimary">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-subTextColor dark:text-darkTextPrimary/50">
            Leave request
          </p>
          <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm text-subTextColor dark:text-darkTextPrimary/50">
            {item.username ?? "Unknown user"}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
            style={{
              backgroundColor: statusTheme.backgroundColor,
              color: statusTheme.color,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: statusTheme.color }}
            />
            {statusTheme.label}
          </span>
        </div>
        <div>
          <p className="text-xs font-medium text-subTextColor dark:text-darkTextPrimary/50">Reason</p>
          <p className="mt-1 text-sm leading-5">
            {item.reason?.trim() || "No reason provided."}
          </p>
        </div>
      </div>
    );
  };

  const renderCalendarItem = (
    item: LeaveCalendarDayItem,
    dateKey: string,
    itemIndex: number,
  ) => {
    const isHoliday = item.type === "holiday";
    const leaveTheme = getLeaveTypeTheme(
      item.type === "leave" ? item.color : "#f59e0b",
    );
    const statusTheme =
      item.type === "leave" ? getLeaveStatusTheme(item.status) : null;

    return (
      <Tooltip key={`${dateKey}-${item.type}-${item.title}-${itemIndex}`}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="block w-full rounded-[12px] border px-3 py-2 text-left text-sm"
            style={{
              borderColor: isHoliday
                ? "rgba(245, 158, 11, 0.28)"
                : leaveTheme.borderColor,
              backgroundColor: isHoliday
                ? "rgba(245, 158, 11, 0.10)"
                : leaveTheme.backgroundColor,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: isHoliday ? "#f59e0b" : leaveTheme.color }}
              />
              <span
                className="truncate font-medium"
                style={{ color: isHoliday ? "#b45309" : leaveTheme.textColor }}
              >
                {item.title}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-subTextColor dark:text-darkTextPrimary">
                {item.type === "leave"
                  ? item.username ?? "Unknown user"
                  : item.source ?? "Holiday"}
              </span>
              {statusTheme ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: statusTheme.backgroundColor,
                    color: statusTheme.color,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: statusTheme.color }}
                  />
                  {statusTheme.label}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  Holiday
                </span>
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="p-4 text-headingTextColor dark:text-darkTextPrimary dark:bg-darkPrimaryBg"
        >
          {renderCalendarItemTooltip(item)}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[12px] border border-borderColor bg-white p-3 sm:p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
              Leave calendar
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
              {format(monthDate, "MMMM yyyy")}
            </h2>
            <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
              Leave and holiday entries are loaded from the monthly calendar API.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {canManageUsers ? (
              <SelectUserDropDown users={users} defaultSelect={false} />
            ) : null}
            <MonthPicker></MonthPicker>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {leaveTypeLegend.map((leaveType) => {
            const theme = getLeaveTypeTheme(leaveType.color);
            return (
              <div
                key={`${leaveType.title}-${leaveType.color ?? ""}`}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
                style={{
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: theme.color }}
                />
                {leaveType.title}
              </div>
            );
          })}
          {hasHolidays ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Holiday
            </div>
          ) : null}
          {!leaveTypeLegend.length && !hasHolidays ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-bgSecondary px-3 py-1 text-sm text-subTextColor dark:text-darkTextSecondary dark:bg-darkPrimaryBg">
              <Sparkles className="size-4" />
              No calendar entries in this month.
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[12px] border border-borderColo dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="grid min-w-[980px] grid-cols-7 border-b border-borderColor dark:border-darkBorder">
          {dayHeaders.map((day) => (
            <div
              key={day}
              className="px-4 py-3 text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid min-w-[980px] grid-cols-7">
          {calendarDays.map(({ date, dateKey, dayItems }, index) => (
            <div
              key={`${dateKey}-${index}`}
              className={`min-h-[165px] border-borderColor p-3 align-top dark:border-darkBorder ${
                index % 7 !== 6 ? "border-r" : ""
              } ${index < 35 ? "border-b" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    isSameMonth(date, monthDate)
                      ? "text-headingTextColor dark:text-darkTextPrimary"
                      : "text-subTextColor/60 dark:text-darkTextSecondary/50"
                  }`}
                >
                  {date.getDate()}
                </span>
                {dayItems.length ? (
                  <span className="text-xs text-subTextColor dark:text-darkTextSecondary">
                    {dayItems.length} item{dayItems.length > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                {dayItems
                  .slice(0, 3)
                  .map((item, itemIndex) =>
                    renderCalendarItem(item, dateKey, itemIndex),
                  )}

                {dayItems.length > 3 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-bgSecondary px-3 py-1 text-xs text-subTextColor dark:text-darkTextPrimary/70 dark:bg-darkPrimaryBg"
                      >
                        <CalendarDays className="size-3.5" />+{dayItems.length - 3} more
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-h-80 overflow-y-auto p-4 text-headingTextColor dark:text-darkTextPrimary"
                    >
                      <div className="w-72 space-y-4">
                        {dayItems.slice(3).map((item, hiddenIndex) => (
                          <div
                            key={`${dateKey}-hidden-${item.type}-${item.title}-${hiddenIndex}`}
                            className="border-b border-borderColor pb-4 last:border-b-0 last:pb-0 dark:border-darkBorder"
                          >
                            {renderCalendarItemTooltip(item)}
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaveCalendarView;