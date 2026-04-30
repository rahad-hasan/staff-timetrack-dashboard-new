"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Eye, RotateCcw, SearchX } from "lucide-react";

import AppPagination from "@/components/Common/AppPagination";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import { Button } from "@/components/ui/button";
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
import LeaveHistoryDetailsSheet from "./LeaveHistoryDetailsSheet";
import SelectDateRange from "@/components/Common/SelectDateRange";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import Image from "next/image";
import EmptyTableLogo from "@/assets/empty_table.svg";

const LeaveHistoryReport = ({
  data,
  canManageUsers,
  users = [],
  total,
  currentPage,
  limit,
}: {
  data: LeaveRecord[];
  canManageUsers: boolean;
  users?: { id: string; label: string; avatar: string }[];
  total: number;
  currentPage: number;
  limit: number;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);

  const statusFilter = searchParams.get("status");

  useEffect(() => {
    setSelectedLeave(null);
  }, [data]);

  const updateQueryParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const clearFilters = () => {
    setSelectedLeave(null);
    router.push(pathname, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <LeaveHistoryDetailsSheet
        leave={selectedLeave}
        open={Boolean(selectedLeave)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLeave(null);
          }
        }}
      />

      <div className="rounded-[12px] border border-borderColor p-3 sm:p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Leave history report
            </h2>
            <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
              Review leave decisions for audit, handover, and operations tracking.
            </p>
          </div>
          <Button disabled variant="outline2" className="dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_270px_170px_auto]">
          {canManageUsers ? (
            <SelectUserDropDown
              users={users}
              defaultSelect={false}
            // resetPageOnChange
            />
          ) : (
            <div className="hidden xl:block" />
          )}
          <SelectDateRange defaultDateShow={false} />
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
          <Button className=" dark:text-darkTextSecondary" variant="outline2" onClick={clearFilters}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
            {total ? `${total} history item${total === 1 ? "" : "s"} found` : "No history items found"}
          </p>
          <div className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
            Long notes are trimmed here. Use View for the full text.
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
              <TableHead>Notes</TableHead>
              <TableHead>Action</TableHead>
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
                        <p className="text-xs text-subTextColor dark:text-darkTextSecondary">{leave.user?.email}</p>
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
                    <TableCell className="max-w-[260px] whitespace-normal">
                      <div className="space-y-2">
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
                <TableCell colSpan={9}>
                  <div className="flex flex-col gap-2.5 items-center justify-center py-8">
                    <Image src={EmptyTableLogo} alt="table empty" width={120} height={120} />
                    <p className="sm:text-lg">
                      No leave history matched the selected filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <AppPagination
          total={total}
          currentPage={currentPage}
          limit={limit}
        />
      </div>
    </div>
  );
};

export default LeaveHistoryReport;
