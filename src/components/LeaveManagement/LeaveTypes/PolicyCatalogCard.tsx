"use client";

import {
  ArrowUpRight,
  Power,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import {
  formatApplicableGender,
  formatNoticeDays,
  getLeaveTypeTheme,
} from "@/lib/leave";
import { LeaveTypeRecord } from "@/types/type";
import EditIcon from "@/components/Icons/FilterOptionIcon/EditIcon";
import DeleteIcon from "@/components/Icons/DeleteIcon";

type Props = {
  leaveType: LeaveTypeRecord;
  resolvedCanEditLeaveTypes: boolean;
  handleOpenDetails: (id: number) => void;
  handleEdit: (leaveType: LeaveTypeRecord) => void;
  handleDeleteType: (leaveType: LeaveTypeRecord) => void;
  handleToggleActive: (leaveType: LeaveTypeRecord, nextState: boolean) => void;
};

const LeaveTypeCard = ({
  leaveType,
  resolvedCanEditLeaveTypes,
  handleOpenDetails,
  handleEdit,
  handleDeleteType,
  handleToggleActive,
}: Props) => {
  const theme = getLeaveTypeTheme(leaveType.color_code);

  return (
    <div
      className="rounded-[12px] border bg-white p-5 dark:bg-darkPrimaryBg"
      style={{
        borderColor: theme.borderColor,
        boxShadow: `inset 0 1px 0 ${theme.backgroundColor}`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: theme.color }}
            />
            <h4 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
              {leaveType.title}
            </h4>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: theme.backgroundColor,
                color: theme.textColor,
              }}
            >
              {leaveType.days_allowed} days / year
            </span>

            <span className="rounded-full bg-bgSecondary px-2.5 py-1 text-xs font-medium text-headingTextColor dark:bg-darkSecondaryBg dark:text-darkTextPrimary">
              {leaveType.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <Button
          variant="outline2"
          size="icon"
          className="dark:bg-darkSecondaryBg dark:text-darkTextPrimary"
          onClick={() => handleOpenDetails(leaveType.id)}
        >
          <ArrowUpRight className="size-4" />
        </Button>
      </div>

      <div className="mt-5 space-y-3 text-sm text-subTextColor dark:text-darkTextSecondary">
        <div className="flex items-center justify-between rounded-[12px] bg-bgSecondary px-4 py-3 dark:bg-darkSecondaryBg">
          <span>Applicable gender</span>
          <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
            {formatApplicableGender(leaveType.applicable_gender)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-[12px] bg-bgSecondary px-4 py-3 dark:bg-darkSecondaryBg">
          <span>Min notice</span>
          <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
            {formatNoticeDays(leaveType.min_notice_days)}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[12px] bg-bgSecondary px-4 py-3 dark:bg-darkSecondaryBg">
            <p className="text-xs uppercase tracking-[0.14em]">Attachment</p>
            <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
              {leaveType.requires_document ? "Required" : "Optional"}
            </p>
          </div>

          <div className="rounded-[12px] bg-bgSecondary px-4 py-3 dark:bg-darkSecondaryBg">
            <p className="text-xs uppercase tracking-[0.14em]">Requests tied</p>
            <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
              {leaveType.leave_requests_count}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          variant="outline2"
          className="dark:bg-darkSecondaryBg dark:text-darkTextPrimary"
          onClick={() => handleOpenDetails(leaveType.id)}
        >
          View details
        </Button>

        {resolvedCanEditLeaveTypes ? (
          <Button
            variant="outline2"
            className="dark:bg-darkSecondaryBg dark:text-darkTextPrimary"
            onClick={() => handleEdit(leaveType)}
          >
            <EditIcon size={20} />
            Edit
          </Button>
        ) : null}

        {resolvedCanEditLeaveTypes ? (
          leaveType.can_delete ? (
            <ConfirmDialog
              trigger={
                <Button variant="outline2" className="dark:bg-darkSecondaryBg dark:text-darkTextPrimary">
                  <DeleteIcon size={20} />
                  Delete
                </Button>
              }
              title={`Delete ${leaveType.title}?`}
              description="This permanently removes the leave type from the tenant workspace."
              confirmText="Delete"
              cancelText="Keep"
              onConfirm={() => handleDeleteType(leaveType)}
            />
          ) : (
            <ConfirmDialog
              trigger={
                <Button variant="outline2" className="dark:bg-darkSecondaryBg dark:text-darkTextPrimary">
                  <Power className="size-4" />
                  {leaveType.is_active ? "Deactivate" : "Activate"}
                </Button>
              }
              title={
                leaveType.is_active
                  ? `Deactivate ${leaveType.title}?`
                  : `Activate ${leaveType.title}?`
              }
              description={
                leaveType.is_active
                  ? "Historical requests will remain intact, but the type will disappear from employee request forms."
                  : "This will restore the leave type to employee request forms."
              }
              confirmText={leaveType.is_active ? "Deactivate" : "Activate"}
              cancelText="Cancel"
              onConfirm={() =>
                handleToggleActive(leaveType, !leaveType.is_active)
              }
            />
          )
        ) : null}
      </div>
    </div>
  );
};

export default LeaveTypeCard;