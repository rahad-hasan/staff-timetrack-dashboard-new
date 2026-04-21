"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, SearchX } from "lucide-react";
import { toast } from "sonner";

import { approveRejectLeave } from "@/actions/leaves/action";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import SearchBar from "@/components/Common/SearchBar";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTZDayMonthYear } from "@/utils";
import { getLeaveStatusTheme, getLeaveTypeTheme } from "@/lib/leave";
import { LeaveRecord } from "@/types/type";
import RejectLeaveRequestModal from "./RejectLeaveRequestModal";

type LeaveRequestTableProps = {
  data: LeaveRecord[];
  canManageUsers: boolean;
  users?: { id: string; label: string; avatar: string }[];
};

const LeaveRequestTable = ({
  data,
  canManageUsers,
  users = [],
}: LeaveRequestTableProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeRejectId, setActiveRejectId] = useState<number | null>(null);

  const isApproved = searchParams.get("approved") === "true";
  const isRejected = searchParams.get("rejected") === "true";

  const updateQueryParam = (key: string, value?: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString());

    if (key === "approved" || key === "rejected") {
      params.delete("approved");
      params.delete("rejected");
    }

    if (value === undefined || value === "" || value === false) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleApprove = async (leave: LeaveRecord) => {
    const response = await approveRejectLeave({
      data: {
        leave_id: leave.id,
        approved: true,
      },
    });

    if (response?.success) {
      toast.success(response.message || "Leave request approved");
      router.refresh();
      return;
    }

    toast.error(response?.message || "Failed to approve leave request", {
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[24px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Leave request queue
            </h2>
            <p className="text-sm text-subTextColor">
              Review pending leave requests and switch to approved or rejected views when needed.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {canManageUsers ? <SelectUserDropDown users={users} defaultSelect={false} /> : null}
            <SearchBar onSearch={(query) => updateQueryParam("search", query)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Checkbox
              id="approved"
              className="border-primary"
              checked={isApproved}
              onCheckedChange={(checked) => updateQueryParam("approved", checked === true)}
            />
            <label htmlFor="approved" className="cursor-pointer text-sm text-headingTextColor dark:text-darkTextPrimary">
              Approved
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="rejected"
              className="border-primary"
              checked={isRejected}
              onCheckedChange={(checked) => updateQueryParam("rejected", checked === true)}
            />
            <label htmlFor="rejected" className="cursor-pointer text-sm text-headingTextColor dark:text-darkTextPrimary">
              Rejected
            </label>
          </div>
          {!isApproved && !isRejected ? (
            <div className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-200">
              Pending requests are shown by default
            </div>
          ) : null}
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
                          <AvatarFallback>
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
                          <p className="text-xs text-subTextColor">{leave.user?.email}</p>
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
                      <div className="max-w-[240px] space-y-1">
                        <p className="text-sm text-headingTextColor dark:text-darkTextPrimary">
                          {leave.reason}
                        </p>
                        {leave.reject_reason ? (
                          <p className="text-xs text-rose-600 dark:text-rose-300">
                            Reject reason: {leave.reject_reason}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {canManageUsers && leave.status === "pending" ? (
                        <div className="flex min-w-[190px] items-center gap-2">
                          <ConfirmDialog
                            trigger={
                              <Button size="sm">
                                <CheckCircle2 className="size-4" />
                                Approve
                              </Button>
                            }
                            title="Approve this leave request?"
                            description="This will update the request queue and the employee leave summary."
                            confirmText="Approve request"
                            cancelText="Cancel"
                            onConfirm={() => handleApprove(leave)}
                            confirmClassName="bg-primary hover:bg-primary/90"
                          />

                          <Dialog
                            open={activeRejectId === leave.id}
                            onOpenChange={(open) => setActiveRejectId(open ? leave.id : null)}
                          >
                            <Button
                              size="sm"
                              className="bg-red-500 hover:bg-red-500"
                              onClick={() => setActiveRejectId(leave.id)}
                            >
                              Reject
                            </Button>
                            {activeRejectId === leave.id ? (
                              <RejectLeaveRequestModal
                                data={leave}
                                onClose={() => setActiveRejectId(null)}
                                onSuccess={() => router.refresh()}
                              />
                            ) : null}
                          </Dialog>
                        </div>
                      ) : (
                        <span className="text-subTextColor">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center text-subTextColor">
                  <div className="flex flex-col items-center gap-2">
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
