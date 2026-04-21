"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, RotateCcw } from "lucide-react";

import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTZDayMonthYear } from "@/utils";
import { getLeaveStatusTheme, getLeaveTypeTheme } from "@/lib/leave";
import { LeaveRecord, LeaveStatus } from "@/types/type";

const LeaveHistoryReport = ({
  data,
  canManageUsers,
  users = [],
}: {
  data: LeaveRecord[];
  canManageUsers: boolean;
  users?: { id: string; label: string; avatar: string }[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get("status");
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";

  const updateQueryParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Leave history report
            </h2>
            <p className="text-sm text-subTextColor">
              Review leave decisions for audit, handover, and operations tracking.
            </p>
          </div>
          <Button disabled variant="outline2" className="dark:bg-darkPrimaryBg">
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_200px_200px_170px_auto]">
          {canManageUsers ? (
            <SelectUserDropDown users={users} defaultSelect={false} />
          ) : (
            <div className="hidden xl:block" />
          )}
          <Input
            type="date"
            value={startDate}
            onChange={(event) => updateQueryParam("start_date", event.target.value)}
            className="dark:border-darkBorder dark:bg-darkPrimaryBg"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(event) => updateQueryParam("end_date", event.target.value)}
            className="dark:border-darkBorder dark:bg-darkPrimaryBg"
          />
          <Select
            value={statusFilter ?? "all"}
            onValueChange={(value) =>
              updateQueryParam("status", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="dark:bg-darkPrimaryBg">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="dark:bg-darkSecondaryBg">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline2" onClick={clearFilters}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="rounded-[24px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
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
              <TableHead>Reject reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length ? (
              data.map((leave) => {
                const leaveTheme = getLeaveTypeTheme(leave.leaveType?.color_code);
                const statusTheme = getLeaveStatusTheme(leave.status as LeaveStatus);

                return (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <Link
                        href={
                          leave.user
                            ? `/leave-management/user-leave-history/${leave.user.id}`
                            : "#"
                        }
                        className="block min-w-[180px]"
                      >
                        <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                          {leave.user?.name ?? "Unknown employee"}
                        </p>
                        <p className="text-xs text-subTextColor">{leave.user?.email}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
                        style={{
                          backgroundColor: leaveTheme.backgroundColor,
                          color: leaveTheme.textColor,
                        }}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: leaveTheme.color }}
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
                    <TableCell className="max-w-[260px] text-sm text-headingTextColor dark:text-darkTextPrimary">
                      {leave.reason}
                    </TableCell>
                    <TableCell className="max-w-[240px] text-sm text-subTextColor">
                      {leave.reject_reason ?? "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center text-subTextColor">
                  No leave history matched the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LeaveHistoryReport;
