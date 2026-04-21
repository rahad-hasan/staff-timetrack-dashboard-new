"use client";

import { format, isSameMonth, parseISO } from "date-fns";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getLeaveStatusTheme, getLeaveTypeTheme } from "@/lib/leave";
import { LeaveRecord } from "@/types/type";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";

const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LeaveCalendarView = ({
  monthDate,
  items,
  canManageUsers = false,
  users = [],
}: {
  monthDate: Date;
  items: LeaveRecord[];
  canManageUsers?: boolean;
  users?: { id: string; label: string; avatar: string }[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const calendarDays = (() => {
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const startPadding = start.getDay();
    const firstVisibleDay = new Date(start);
    firstVisibleDay.setDate(start.getDate() - startPadding);

    return Array.from({ length: 42 }).map((_, index) => {
      const date = new Date(firstVisibleDay);
      date.setDate(firstVisibleDay.getDate() + index);

      const dayItems = items.filter((item) => {
        const startDate = parseISO(item.start_date);
        const endDate = parseISO(item.end_date);
        return date >= startDate && date <= endDate;
      });

      return { date, dayItems };
    });
  })();

  const leaveTypeLegend = Array.from(
    new Map(
      items.map((item) => [item.leaveType.id, item.leaveType]),
    ).values(),
  );

  const navigateMonth = (offset: number) => {
    const nextDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + offset, 1);
    const monthStart = format(nextDate, "yyyy-MM-dd");
    const monthEnd = format(
      new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0),
      "yyyy-MM-dd",
    );

    const params = new URLSearchParams(searchParams.toString());
    params.set("start_month", monthStart);
    params.set("end_month", monthEnd);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const goToToday = () => {
    const now = new Date();
    const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
    const monthEnd = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd");
    const params = new URLSearchParams(searchParams.toString());
    params.set("start_month", monthStart);
    params.set("end_month", monthEnd);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[24px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-subTextColor">
              Leave calendar
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
              {format(monthDate, "MMMM yyyy")}
            </h2>
            <p className="mt-1 text-sm text-subTextColor">
              Leave chips use each tenant leave type color. Holiday overlays will connect once the existing holiday API is surfaced in this frontend.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {canManageUsers ? (
              <SelectUserDropDown users={users} defaultSelect={false} />
            ) : null}
            <Button variant="outline2" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline2" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline2" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {leaveTypeLegend.length ? (
            leaveTypeLegend.map((leaveType) => {
              const theme = getLeaveTypeTheme(leaveType.color_code);
              return (
                <div
                  key={leaveType.id}
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
            })
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-bgSecondary px-3 py-1 text-sm text-subTextColor dark:bg-darkPrimaryBg">
              <Sparkles className="size-4" />
              No leave requests in this month.
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-borderColor bg-white shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
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
          {calendarDays.map(({ date, dayItems }, index) => (
            <div
              key={`${date.toISOString()}-${index}`}
              className={`min-h-[165px] border-borderColor p-3 align-top dark:border-darkBorder ${
                index % 7 !== 6 ? "border-r" : ""
              } ${index < 35 ? "border-b" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    isSameMonth(date, monthDate)
                      ? "text-headingTextColor dark:text-darkTextPrimary"
                      : "text-subTextColor/60"
                  }`}
                >
                  {date.getDate()}
                </span>
                {dayItems.length ? (
                  <span className="text-xs text-subTextColor">{dayItems.length} leave</span>
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                {dayItems.slice(0, 3).map((leave) => {
                  const leaveTheme = getLeaveTypeTheme(leave.leaveType?.color_code);
                  const statusTheme = getLeaveStatusTheme(leave.status);

                  return (
                    <Link
                      key={`${leave.id}-${date.toISOString()}`}
                      href={
                        leave.user
                          ? `/leave-management/user-leave-history/${leave.user.id}`
                          : "/leave-management/my-leaves"
                      }
                      className="block rounded-2xl border px-3 py-2 text-sm"
                      style={{
                        borderColor: leaveTheme.borderColor,
                        backgroundColor: leaveTheme.backgroundColor,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: leaveTheme.color }}
                        />
                        <span className="truncate font-medium" style={{ color: leaveTheme.textColor }}>
                          {leave.leaveType?.title}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-subTextColor">
                          {leave.user?.name ?? "You"}
                        </span>
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
                      </div>
                    </Link>
                  );
                })}

                {dayItems.length > 3 ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-bgSecondary px-3 py-1 text-xs text-subTextColor dark:bg-darkPrimaryBg">
                    <CalendarDays className="size-3.5" />+{dayItems.length - 3} more
                  </div>
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
