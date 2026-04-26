"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  Clock3,
  FileText,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getLeaveStatusTheme, getLeaveTypeTheme } from "@/lib/leave";
import { LeaveRecord, LeaveStatus } from "@/types/type";
import { formatTZDayMonthYear } from "@/utils";

type LeaveHistoryDetailsSheetProps = {
  leave: LeaveRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getEmployeeInitials(name?: string) {
  if (!name?.trim()) {
    return "NA";
  }

  return name
    .trim()
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const LeaveHistoryDetailsSheet = ({
  leave,
  open,
  onOpenChange,
}: LeaveHistoryDetailsSheetProps) => {
  const leaveTypeTheme = useMemo(
    () => getLeaveTypeTheme(leave?.leaveType?.color_code),
    [leave?.leaveType?.color_code],
  );
  const statusTheme = useMemo(
    () => getLeaveStatusTheme((leave?.status ?? "pending") as LeaveStatus),
    [leave?.status],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-borderColor px-0 dark:border-darkBorder dark:bg-darkSecondaryBg sm:max-w-[560px]"
      >
        <SheetHeader className="border-b border-borderColor px-6 pb-5 dark:border-darkBorder">
          <SheetTitle className="text-xl text-headingTextColor dark:text-darkTextPrimary">
            Leave history details
          </SheetTitle>
          <SheetDescription>
            Review the full request note, audit trail, and leave summary for this history entry.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          {leave ? (
            <>
              <div
                className="rounded-[12px] border bg-white p-5 shadow-sm dark:bg-darkPrimaryBg"
                style={{
                  borderColor: leaveTypeTheme.borderColor,
                  boxShadow: `inset 0 1px 0 ${leaveTypeTheme.backgroundColor}`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11">
                        <AvatarImage
                          src={leave.user?.image ?? ""}
                          alt={leave.user?.name ?? "Unknown employee"}
                        />
                        <AvatarFallback>
                          {getEmployeeInitials(leave.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          {leave.user?.name ?? "Unknown employee"}
                        </p>
                        <p className="truncate text-sm text-subTextColor dark:text-darkTextSecondary">
                          {leave.user?.email || "No email available"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
                        style={{
                          backgroundColor: leaveTypeTheme.backgroundColor,
                          color: leaveTypeTheme.textColor,
                        }}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: leaveTypeTheme.color }}
                        />
                        {leave.leaveType?.title ?? "Leave type"}
                      </span>
                      <span
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium"
                        style={{
                          borderColor: statusTheme.borderColor,
                          backgroundColor: statusTheme.backgroundColor,
                          color: statusTheme.color,
                        }}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: statusTheme.color }}
                        />
                        {statusTheme.label}
                      </span>
                    </div>
                  </div>

                  {leave.user ? (
                    <Button asChild variant="outline2" className="dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
                      <Link href={`/leave-management/user-leave-history/${leave.user.id}`}>
                        Open profile
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                    Start date
                  </p>
                  <p className="mt-2 text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {formatTZDayMonthYear(leave.start_date)}
                  </p>
                </div>
                <div className="rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                    End date
                  </p>
                  <p className="mt-2 text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {formatTZDayMonthYear(leave.end_date)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <CalendarClock className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                        Leave days
                      </p>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">Approved date span</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {leave.leave_count}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <Clock3 className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                        Approved hours
                      </p>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">Calculated time coverage</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {leave.approved_hours_formatted}
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                        HR approval
                      </p>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">Internal reviewer checkpoint</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {leave.hr_approved ? "Approved" : "Pending / not approved"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <UserRound className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                        Admin approval
                      </p>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">Final approval checkpoint</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {leave.admin_approved ? "Approved" : "Pending / not approved"}
                  </span>
                </div>
              </div>

              <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    Leave reason
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
                  {leave.reason}
                </p>
              </div>

              <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    Reject reason
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
                  {leave.reject_reason || "No rejection note for this request."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                    Created
                  </p>
                  <p className="mt-2 text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {formatTZDayMonthYear(leave.created_at)}
                  </p>
                </div>
                <div className="rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                    Updated
                  </p>
                  <p className="mt-2 text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {formatTZDayMonthYear(leave.updated_at)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-[24px] border border-dashed border-borderColor px-5 py-10 text-center text-subTextColor dark:text-darkTextSecondary dark:border-darkBorder">
              Select a leave history row to review the full details.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LeaveHistoryDetailsSheet;
