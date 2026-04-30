"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  FileImage,
  FileText,
  Loader2,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { approveRejectLeave } from "@/actions/leaves/action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

type LeaveRequestDetailsSheetProps = {
  leave: LeaveRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManageUsers: boolean;
  canTakeAction: boolean;
  onMutated: () => void;
};

type AttachmentInfo = {
  url: string;
  name?: string | null;
  mimeType?: string | null;
  sourceKey: string;
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

function extractAttachmentInfo(leave: LeaveRecord | null): AttachmentInfo | null {
  if (!leave) {
    return null;
  }

  const record = leave as LeaveRecord & Record<string, unknown>;
  const candidateKeys = [
    "supporting_document_url",
    "supporting_document",
    "document_url",
    "document",
    "attachment_url",
    "attachment",
    "file_url",
    "file",
  ] as const;
  const nameKeys = [
    "supporting_document_name",
    "document_name",
    "attachment_name",
    "file_name",
  ] as const;
  const mimeKeys = [
    "supporting_document_mime_type",
    "document_mime_type",
    "attachment_mime_type",
    "file_mime_type",
    "mime_type",
  ] as const;

  const matchedKey = candidateKeys.find((key) => typeof record[key] === "string" && record[key]);

  if (!matchedKey) {
    return null;
  }

  const nameKey = nameKeys.find((key) => typeof record[key] === "string" && record[key]);
  const mimeKey = mimeKeys.find((key) => typeof record[key] === "string" && record[key]);

  return {
    url: String(record[matchedKey]),
    name: nameKey ? String(record[nameKey]) : null,
    mimeType: mimeKey ? String(record[mimeKey]) : null,
    sourceKey: matchedKey,
  };
}

function isPdfAttachment(attachment: AttachmentInfo | null) {
  if (!attachment) {
    return false;
  }

  const lowerUrl = attachment.url.toLowerCase();
  const lowerMime = attachment.mimeType?.toLowerCase() ?? "";

  return lowerMime.includes("pdf") || lowerUrl.endsWith(".pdf");
}

function isImageAttachment(attachment: AttachmentInfo | null) {
  if (!attachment) {
    return false;
  }

  const lowerUrl = attachment.url.toLowerCase();
  const lowerMime = attachment.mimeType?.toLowerCase() ?? "";

  return (
    lowerMime.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"].some((ext) =>
      lowerUrl.endsWith(ext),
    )
  );
}

const LeaveRequestDetailsSheet = ({
  leave,
  open,
  onOpenChange,
  canManageUsers,
  canTakeAction,
  onMutated,
}: LeaveRequestDetailsSheetProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const leaveTypeTheme = useMemo(
    () => getLeaveTypeTheme(leave?.leaveType?.color_code),
    [leave?.leaveType?.color_code],
  );
  const statusTheme = useMemo(
    () => getLeaveStatusTheme((leave?.status ?? "pending") as LeaveStatus),
    [leave?.status],
  );
  const attachment = useMemo(() => extractAttachmentInfo(leave), [leave]);
  const canReviewAction = canTakeAction && leave?.status === "pending";

  console.log("canTakeAction", canTakeAction)

  const resetActionState = () => {
    setRejectMode(false);
    setRejectReason("");
    setIsSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetActionState();
    }

    onOpenChange(nextOpen);
  };

  const handleApprove = async () => {
    if (!leave || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const response = await approveRejectLeave({
      data: {
        leave_id: leave.id,
        approved: true,
      },
    });

    if (response?.success) {
      toast.success(response.message || "Leave request approved");
      resetActionState();
      onMutated();
      handleOpenChange(false);
      return;
    }

    toast.error(response?.message || "Failed to approve leave request", {
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
      },
    });
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!leave || isSubmitting) {
      return;
    }

    if (!rejectReason.trim()) {
      toast.error("Reject reason is required", {
        style: {
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
        },
      });
      return;
    }

    setIsSubmitting(true);

    const response = await approveRejectLeave({
      data: {
        leave_id: leave.id,
        approved: false,
        reject_reason: rejectReason.trim(),
      },
    });

    if (response?.success) {
      toast.success(response.message || "Leave request rejected");
      resetActionState();
      onMutated();
      handleOpenChange(false);
      return;
    }

    toast.error(response?.message || "Failed to reject leave request", {
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
      },
    });
    setIsSubmitting(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-borderColor px-0 dark:border-darkBorder dark:bg-darkSecondaryBg sm:max-w-[620px]"
      >
        <SheetHeader className="border-b border-borderColor px-6 pb-5 dark:border-darkBorder">
          <SheetTitle className="text-xl text-headingTextColor dark:text-darkTextPrimary">
            Leave request details
          </SheetTitle>
          <SheetDescription>
            Review the full request note, supporting document, and workflow actions for this leave entry.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          {leave ? (
            <>
              <div
                className="rounded-[12px] border bg-white p-5 dark:bg-darkPrimaryBg"
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

                  {canManageUsers && leave.user ? (
                    <Button asChild variant="outline2" className="dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
                      <Link href={`/members/${leave.user.id}`}>
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
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">Requested date span</p>
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
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">Final reviewer checkpoint</p>
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

              <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isImageAttachment(attachment) ? (
                      <FileImage className="size-4 text-primary" />
                    ) : (
                      <Eye className="size-4 text-primary" />
                    )}
                    <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                      Supporting document
                    </p>
                  </div>

                  {attachment ? (
                    <Button asChild variant="outline2" size="sm" className="dark:bg-darkSecondaryBg">
                      <a href={attachment.url} target="_blank" rel="noreferrer">
                        Open file
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>

                {attachment ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-[12px] bg-bgSecondary/60 px-4 py-3 text-sm text-subTextColor dark:text-darkTextSecondary dark:bg-darkSecondaryBg">
                      <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                        {attachment.name || "Uploaded supporting document"}
                      </p>
                      <p className="mt-1 break-all text-xs">
                        Source field: <code>{attachment.sourceKey}</code>
                      </p>
                    </div>

                    {isPdfAttachment(attachment) ? (
                      <div className="overflow-hidden rounded-[12px] border border-borderColor dark:border-darkBorder">
                        <iframe
                          src={attachment.url}
                          title={attachment.name || "Supporting document"}
                          className="h-[420px] w-full bg-white"
                        />
                      </div>
                    ) : isImageAttachment(attachment) ? (
                      <div className="overflow-hidden rounded-[12px] border border-borderColor bg-bgSecondary/40 dark:border-darkBorder dark:bg-darkSecondaryBg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={attachment.url}
                          alt={attachment.name || "Supporting document"}
                          className="max-h-[420px] w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="rounded-[12px] border border-dashed border-borderColor px-4 py-10 text-center text-sm text-subTextColor dark:text-darkTextSecondary dark:border-darkBorder">
                        This file type cannot be previewed inline. Use <code>Open file</code> to review it.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[12px] border border-dashed border-borderColor px-4 py-10 text-center text-sm text-subTextColor dark:text-darkTextSecondary dark:border-darkBorder">
                    No supporting document is attached to this request.
                  </div>
                )}
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

              {canTakeAction ? (
                <div className="rounded-[12px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    Workflow actions
                  </p>
                  <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                    Admin and HR can review the request in full, then approve or reject it from this side panel.
                  </p>

                  {canReviewAction ? (
                    <>
                      {!rejectMode ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button onClick={handleApprove} disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                Approving
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="size-4" />
                                Accept request
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline2"
                            className="border-red-200 text-red-600 hover:text-red-700 dark:bg-darkSecondaryBg dark:text-red-300"
                            onClick={() => setRejectMode(true)}
                            disabled={isSubmitting}
                          >
                            <XCircle className="size-4" />
                            Reject request
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <Textarea
                            rows={5}
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                            placeholder="Explain why this request is being rejected"
                            className="dark:border-darkBorder dark:bg-darkSecondaryBg"
                          />

                          <div className="flex flex-wrap gap-3">
                            <Button
                              className="bg-red-500 hover:bg-red-500"
                              onClick={handleReject}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="size-4 animate-spin" />
                                  Rejecting
                                </>
                              ) : (
                                <>
                                  <XCircle className="size-4" />
                                  Confirm reject
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline2"
                              onClick={() => {
                                setRejectMode(false);
                                setRejectReason("");
                              }}
                              disabled={isSubmitting}
                              className="dark:bg-darkSecondaryBg"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-4 rounded-[12px] border border-dashed border-borderColor px-4 py-8 text-center text-sm text-subTextColor dark:text-darkTextSecondary dark:border-darkBorder">
                      This request is already {leave.status}. Workflow actions are unavailable.
                    </div>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-[12px] border border-dashed border-borderColor px-5 py-10 text-center text-subTextColor dark:text-darkTextSecondary dark:border-darkBorder">
              Select a leave request to review the full details.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LeaveRequestDetailsSheet;