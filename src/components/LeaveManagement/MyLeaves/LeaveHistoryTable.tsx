"use client"
import { deleteLeave } from "@/actions/leaves/action";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { Button } from "@/components/ui/button";
import { getLeaveStatusTheme, getLeaveTypeTheme } from "@/lib/leave";
import { LeaveRecord, UserLeaveSummary } from "@/types/type";
import { formatTZDayMonthYear } from "@/utils";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type LeaveHistoryTableProps = {
  data: UserLeaveSummary;
  currentUserId?: number;
  allowRequestLeave?: boolean;
};
const LeaveHistoryTable = ({ data, currentUserId, allowRequestLeave }: LeaveHistoryTableProps) => {
  const router = useRouter();

  type HistoryTab = "pending" | "approved" | "rejected";

  const tabConfig: { key: HistoryTab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];
  const [activeTab, setActiveTab] = useState<HistoryTab>("pending");
  const requestCounts = {
    pending: data.requests.pending.length,
    approved: data.requests.approved.length,
    rejected: data.requests.rejected.length,
  };
  const historyItems = useMemo(
    () => data.requests[activeTab],
    [activeTab, data.requests],
  );

  const isSelfView = currentUserId === data.user.id;
  const canRequestLeave = allowRequestLeave ?? isSelfView;

  const renderRequestCard = (request: LeaveRecord) => {
    const leaveTypeTheme = getLeaveTypeTheme(request.leaveType?.color_code);
    const statusTheme = getLeaveStatusTheme(request.status);
    const canDelete =
      canRequestLeave &&
      request.status === "pending" &&
      currentUserId === data.user.id &&
      currentUserId === request.user_id;

    const handleDeleteRequest = async (leaveId: number) => {
      const response = await deleteLeave(leaveId);

      if (response?.success) {
        toast.success(response.message || "Leave request deleted");
        router.refresh();
        return;
      }

      toast.error(response?.message || "Failed to delete leave request", {
        style: {
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
        },
      });
    };

    return (
      <div
        key={request.id}
        className="rounded-[12px] border border-borderColor p-4 dark:border-darkBorder dark:bg-darkSecondaryBg"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
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
                {request.leaveType?.title}
              </div>
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
            </div>

            <div className="grid gap-3 text-sm text-subTextColor dark:text-darkTextSecondary sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em]">Dates</p>
                <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                  {formatTZDayMonthYear(request.start_date)} to{" "}
                  {formatTZDayMonthYear(request.end_date)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em]">Duration</p>
                <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                  {request.leave_count} day(s)
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em]">
                  Approved hours
                </p>
                <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                  {request.approved_hours_formatted}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                  Reason
                </p>
                <p className="mt-1 text-sm text-headingTextColor dark:text-darkTextPrimary">
                  {request.reason}
                </p>
              </div>
              {request.reject_reason ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                  Reject reason: {request.reject_reason}
                </div>
              ) : null}
            </div>
          </div>

          {canDelete ? (
            <ConfirmDialog
              trigger={
                <Button
                  variant="outline2"
                  className="shrink-0 dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                >
                  <Trash2 className="size-4" />
                  Cancel request
                </Button>
              }
              title="Cancel this leave request?"
              description="Only pending requests can be deleted. This will refresh balances and request history."
              confirmText="Delete request"
              cancelText="Keep request"
              onConfirm={() => handleDeleteRequest(request.id)}
            />
          ) : null}
        </div>
      </div>
    );
  };


  return (
    <div className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
      <div className="flex flex-col gap-4 border-b border-borderColor pb-4 dark:border-darkBorder sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
            Leave history
          </h2>
          <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
            Review pending, approved, and rejected requests separately.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabConfig.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition cursor-pointer ${isActive
                  ? "bg-primary text-white"
                  : "bg-bgSecondary text-headingTextColor dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                  }`}
              >
                {tab.label} ({requestCounts[tab.key]})
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {historyItems.length ? (
          historyItems.map(renderRequestCard)
        ) : (
            <div className=" flex justify-center h-68">
                  <EmptyTableRow columns={2} text={`No ${activeTab} leave requests found for this year.`}></EmptyTableRow>
            </div>
        )}
      </div>
    </div>
  );
};

export default LeaveHistoryTable;