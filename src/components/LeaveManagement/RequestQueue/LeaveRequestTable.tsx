"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, SearchX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTZDayMonthYear } from "@/utils";
import { getLeaveStatusTheme, getLeaveTypeTheme } from "@/lib/leave";
import { LeaveRecord } from "@/types/type";
import LeaveRequestDetailsSheet from "./LeaveRequestDetailsSheet";
import LeaveRequestHeroCart from "./LeaveRequestHeroCart";

type LeaveRequestTableProps = {
  data: LeaveRecord[];
  canManageUsers: boolean;
  canTakeAction: boolean;
  users?: { id: string; label: string; avatar: string }[];
};

const LeaveRequestTable = ({
  data,
  canManageUsers,
  canTakeAction,
  users = [],
}: LeaveRequestTableProps) => {
  const router = useRouter();
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  useEffect(() => {
    setSelectedLeave(null);
  }, [data]);


  return (
    <div className="space-y-5">
      <LeaveRequestDetailsSheet
        leave={selectedLeave}
        open={Boolean(selectedLeave)}
        canTakeAction={canTakeAction}
        onMutated={() => router.refresh()}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLeave(null);
          }
        }}
      />

      <LeaveRequestHeroCart canManageUsers={canManageUsers} users={users}></LeaveRequestHeroCart>

      <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
            Review requests in the table, then open the side drawer for the full note, document preview, and workflow actions.
          </p>
          <div className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
            Long reasons are trimmed here
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Leave type</TableHead>
              <TableHead>Start date</TableHead>
              <TableHead>End date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Approved hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length ? (
              data.map((leave) => {
                const leaveTypeTheme = getLeaveTypeTheme(leave.leaveType?.color_code);
                const statusTheme = getLeaveStatusTheme(leave.status);
                const employeeName = leave.user?.name ?? "Unknown employee";

                return (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <Link
                        href={
                          leave.user
                            ? `/leave-management/user-leave-history/${leave.user.id}`
                            : "#"
                        }
                        className="flex min-w-[180px] items-center gap-3"
                      >
                        <Avatar>
                          <AvatarImage src={leave.user?.image ?? ""} alt={employeeName} />
                          <AvatarFallback className=" dark:bg-darkPrimaryBg">
                            {employeeName
                              .trim()
                              .split(" ")
                              .map((word) => word[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                            {employeeName}
                          </p>
                          <p className="text-xs text-subTextColor dark:text-darkTextSecondary">{leave.user?.email}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div
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
                        {leave.leaveType?.title}
                      </div>
                    </TableCell>
                    <TableCell>{formatTZDayMonthYear(leave.start_date)}</TableCell>
                    <TableCell>{formatTZDayMonthYear(leave.end_date)}</TableCell>
                    <TableCell>{leave.leave_count}</TableCell>
                    <TableCell>{leave.approved_hours_formatted}</TableCell>
                    <TableCell>
                      <div
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[240px] space-y-2 whitespace-normal">
                        <p
                          className="line-clamp-2 break-words text-sm text-headingTextColor dark:text-darkTextPrimary"
                          title={leave.reason}
                        >
                          {leave.reason}
                        </p>
                        {leave.reject_reason ? (
                          <p
                            className="line-clamp-2 break-words text-xs text-rose-600 dark:text-rose-300"
                            title={leave.reject_reason}
                          >
                            Reject reason: {leave.reject_reason}
                          </p>
                        ) : (
                          <p className="text-xs text-subTextColor dark:text-darkTextSecondary">No rejection note</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline2"
                        size="sm"
                        className="dark:bg-darkPrimaryBg dark:text-darkTextSecondary"
                        onClick={() => setSelectedLeave(leave)}
                      >
                        <Eye className="size-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center text-subTextColor dark:text-darkTextSecondary">
                  <div className="flex py-12 flex-col items-center gap-4">
                    <SearchX className="size-6" />
                    <span>No leave requests found for the current filters.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LeaveRequestTable;