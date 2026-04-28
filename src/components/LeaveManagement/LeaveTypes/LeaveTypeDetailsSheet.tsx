"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  FileText,
  LoaderCircle,
  PencilLine,
  Power,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteLeaveType, getLeaveType, updateLeaveType } from "@/actions/leaves/action";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatApplicableGender, formatNoticeDays, getLeaveTypeTheme } from "@/lib/leave";
import { LeaveTypeRecord } from "@/types/type";
import { formatTZDayMonthYear } from "@/utils";

type LeaveTypeDetailsSheetProps = {
  leaveTypeId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEditLeaveTypes: boolean;
  onEdit: (leaveType: LeaveTypeRecord) => void;
  onMutated: () => void;
  refreshKey?: number;
};

const LeaveTypeDetailsSheet = ({
  leaveTypeId,
  open,
  onOpenChange,
  canEditLeaveTypes,
  onEdit,
  onMutated,
  refreshKey = 0,
}: LeaveTypeDetailsSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveTypeRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !leaveTypeId) return;

    let active = true;

    const loadLeaveType = async () => {
      setLoading(true);
      setErrorMessage(null);
      // single leave
      const response = await getLeaveType(leaveTypeId);
      console.log(response)

      if (!active) return;

      if (response?.success) {
        setLeaveType(response.data);
      } else {
        setLeaveType(null);
        setErrorMessage(response?.message || "Failed to load leave type details");
      }

      setLoading(false);
    };

    loadLeaveType();

    return () => {
      active = false;
    };
  }, [leaveTypeId, open, refreshKey]);

  const theme = useMemo(
    () => getLeaveTypeTheme(leaveType?.color_code),
    [leaveType?.color_code],
  );

  const handleDelete = async () => {
    if (!leaveType) return;

    const response = await deleteLeaveType(leaveType.id);

    if (response?.success) {
      toast.success(response.message || "Leave type deleted");
      onOpenChange(false);
      onMutated();
      return;
    }

    toast.error(response?.message || "Failed to delete leave type", {
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
      },
    });
  };

  const handleToggleActive = async (nextState: boolean) => {
    if (!leaveType) return;

    const response = await updateLeaveType(leaveType.id, {
      is_active: nextState,
    });

    if (response?.success) {
      toast.success(
        response.message ||
          (nextState ? "Leave type activated" : "Leave type deactivated"),
      );
      setLeaveType(response.data);
      onMutated();
      return;
    }

    toast.error(response?.message || "Failed to update leave type", {
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-borderColor px-0 dark:border-darkBorder dark:bg-darkSecondaryBg sm:max-w-[540px]"
      >
        <SheetHeader className="border-b border-borderColor px-6 pb-5 dark:border-darkBorder">
          <SheetTitle className="text-xl text-headingTextColor dark:text-darkTextPrimary">
            Leave type details
          </SheetTitle>
          <SheetDescription className="dark:text-darkTextSecondary">
            Review the current policy and lifecycle controls for this leave type.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center text-subTextColor">
              <LoaderCircle className="mr-2 size-5 animate-spin" />
              Loading leave type...
            </div>
          ) : errorMessage ? (
            <div className="rounded-[12px] border border-dashed border-borderColor px-5 py-10 text-center text-subTextColor dark:border-darkBorder">
              {errorMessage}
            </div>
          ) : leaveType ? (
            <>
              <div
                className="rounded-[12px] border bg-white p-5 shadow-sm dark:bg-darkPrimaryBg"
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
                      <h3 className="text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                        {leaveType.title}
                      </h3>
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
                      <span className="rounded-full bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">
                        {leaveType.leave_requests_count} requests
                      </span>
                    </div>
                  </div>

                  {canEditLeaveTypes ? (
                    <Button
                      variant="outline2"
                      className="dark:bg-darkSecondaryBg dark:text-darkTextPrimary"
                      onClick={() => onEdit(leaveType)}
                    >
                      <PencilLine className="size-4" />
                      Edit
                    </Button>
                  ) : null}
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
                        Applicable gender
                      </p>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">Eligibility rule</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {formatApplicableGender(leaveType.applicable_gender)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <CalendarClock className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                        Notice rule
                      </p>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">Advance planning requirement</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {formatNoticeDays(leaveType.min_notice_days)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <FileText className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                        Attachment policy
                      </p>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">Document submission requirement</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {leaveType.requires_document ? "Required" : "Optional"}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                    <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                      Back-dated requests
                    </p>
                    <p className="mt-2 text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
                      {leaveType.allow_past_dates ? "Allowed" : "Blocked"}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                    <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                      Safe delete
                    </p>
                    <p className="mt-2 text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
                      {leaveType.can_delete ? "Can be deleted" : "Must be set inactive"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                    <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                      Created
                    </p>
                    <p className="mt-2 text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
                      {formatTZDayMonthYear(leaveType.created_at)}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-borderColor bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                    <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                      Updated
                    </p>
                    <p className="mt-2 text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
                      {formatTZDayMonthYear(leaveType.updated_at)}
                    </p>
                  </div>
                </div>
              </div>

              {canEditLeaveTypes ? (
                <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    Lifecycle actions
                  </p>
                  <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                    Delete only when this type has never been used. Otherwise set it inactive so historical requests stay valid.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {leaveType.can_delete ? (
                      <ConfirmDialog
                        trigger={
                          <Button variant="outline2" className="dark:bg-darkSecondaryBg dark:text-darkTextPrimary">
                            <Trash2 className="size-4" />
                            Delete type
                          </Button>
                        }
                        title={`Delete ${leaveType.title}?`}
                        description="This permanently removes the leave type from the tenant workspace."
                        confirmText="Delete"
                        cancelText="Keep"
                        onConfirm={handleDelete}
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
                            ? "Historical requests will remain visible, but employees will no longer see this type while applying for leave."
                            : "This will make the leave type available again in employee request flows."
                        }
                        confirmText={leaveType.is_active ? "Deactivate" : "Activate"}
                        cancelText="Cancel"
                        onConfirm={() => handleToggleActive(!leaveType.is_active)}
                      />
                    )}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LeaveTypeDetailsSheet;
