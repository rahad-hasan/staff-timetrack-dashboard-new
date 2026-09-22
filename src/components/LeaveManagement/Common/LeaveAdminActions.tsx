"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { deleteLeave } from "@/actions/leaves/action";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import DeleteIcon from "@/components/Icons/DeleteIcon";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { LeaveRecord } from "@/types/type";
import LeaveEditDialog from "./LeaveEditDialog";

type LeaveAdminActionsProps = {
  leave: LeaveRecord;
  canManage: boolean;
  onMutated: () => void;
  onClose?: () => void;
  owner?: { name?: string; gender?: string | null };
};

function getDeleteDescription(leave: LeaveRecord) {
  if (leave.status === "approved") {
    return `This leave is approved. Deleting it restores ${leave.leave_count} day(s) to the balance and removes ${leave.approved_hours_formatted} of approved hours from payroll. This cannot be undone.`;
  }

  if (leave.status === "rejected") {
    return "This removes the rejected record from history. This cannot be undone.";
  }

  return "This removes the request from the queue. The employee will need to submit a new request. This cannot be undone.";
}

const LeaveAdminActions = ({
  leave,
  canManage,
  onMutated,
  onClose,
  owner,
}: LeaveAdminActionsProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!canManage) return null;

  // My Leaves rows are clipped to the selected year; act on the stored record.
  const record: LeaveRecord = leave.unscoped
    ? { ...leave, ...leave.unscoped }
    : leave;
  const isRejected = leave.status === "rejected";
  const isApproved = leave.status === "approved";
  const ownerName = leave.user?.name ?? owner?.name ?? "this employee";
  const ownerGender = leave.user?.gender ?? owner?.gender ?? undefined;
  const hintId = `leave-edit-hint-${leave.id}`;

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    const response = await deleteLeave(leave.id);

    if (response?.success) {
      toast.success(response.message || "Leave request deleted");
      onMutated();
      onClose?.();
      return;
    }

    toast.error(response?.message || "Failed to delete leave request", {
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
      },
    });
    setIsDeleting(false);
  };

  return (
    <div className="rounded-[12px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkPrimaryBg">
      <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
        Admin actions
      </p>
      <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
        Correct a wrong leave type or overlapping dates, or remove the record
        entirely. Changes apply immediately.
      </p>
      {isApproved ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          This leave is approved. Editing recalculates approved hours and
          payroll; deleting restores the days to the balance.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline2"
          className="w-full dark:bg-darkSecondaryBg sm:w-auto"
          disabled={isRejected || isDeleting}
          aria-describedby={isRejected ? hintId : undefined}
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-4" aria-hidden />
          Edit request
        </Button>

        <ConfirmDialog
          trigger={
            <Button
              type="button"
              variant="outline2"
              className="w-full border-red-200 text-red-600 hover:text-red-700 dark:bg-darkSecondaryBg dark:text-red-300 sm:w-auto"
              disabled={isDeleting}
            >
              <DeleteIcon size={18} />
              Delete request
            </Button>
          }
          title={`Delete ${ownerName}'s leave request?`}
          description={getDeleteDescription(record)}
          confirmText="Delete request"
          cancelText="Keep request"
          onConfirm={handleDelete}
        />
      </div>

      {isRejected ? (
        <p
          id={hintId}
          className="mt-3 text-xs text-subTextColor dark:text-darkTextSecondary"
        >
          Rejected requests are closed records and cannot be edited. Delete it
          if it was filed by mistake and ask the employee to submit a new
          request.
        </p>
      ) : null}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        {editOpen ? (
          <LeaveEditDialog
            leave={record}
            ownerGender={ownerGender}
            ownerName={ownerName}
            onClose={() => setEditOpen(false)}
            onSuccess={() => {
              onMutated();
              onClose?.();
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
};

export default LeaveAdminActions;
