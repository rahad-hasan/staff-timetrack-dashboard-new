"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  FileWarning,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { deleteLeave } from "@/actions/leaves/action";
import HeadingComponent from "@/components/Common/HeadingComponent";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import { YearPicker } from "@/components/Common/YearPicker";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  formatApplicableGender,
  formatNoticeDays,
  getLeaveStatusTheme,
  getLeaveTypeTheme,
} from "@/lib/leave";
import { useLogInUserStore } from "@/store/logInUserStore";
import {
  LeaveRecord,
  LeaveRequestTypeDropdownRecord,
  UserLeaveSummary,
} from "@/types/type";
import { formatTZDayMonthYear } from "@/utils";
import LeaveRequestModal from "../shared/LeaveRequestModal";

type MyLeavesDashboardProps = {
  data: UserLeaveSummary;
  leaveTypes: LeaveRequestTypeDropdownRecord[];
  currentUserId?: number;
  canManageUsers?: boolean;
  users?: { id: string; label: string; avatar: string }[];
  allowRequestLeave?: boolean;
  headingTitle?: string;
  headingSubtitle?: string;
  showUserSelector?: boolean;
  backHref?: string;
  backLabel?: string;
};

type HistoryTab = "pending" | "approved" | "rejected";

const tabConfig: { key: HistoryTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const formatHolidayDate = (value: string) => {
  const parsedDate = parseISO(value);

  if (!isValid(parsedDate)) {
    return value;
  }

  return format(parsedDate, "MMM d, yyyy");
};

const formatHolidayWeekday = (value: string) => {
  const parsedDate = parseISO(value);

  if (!isValid(parsedDate)) {
    return "";
  }

  return format(parsedDate, "EEE");
};

const MyLeavesDashboard = ({
  data,
  leaveTypes,
  currentUserId,
  canManageUsers = false,
  users = [],
  allowRequestLeave,
  headingTitle,
  headingSubtitle,
  showUserSelector = true,
  backHref,
  backLabel = "Back",
}: MyLeavesDashboardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loader = useTopLoader();
  const logInUserRole = useLogInUserStore((state) => state.logInUserData?.role);
  const resolvedCanManageUsers =
    canManageUsers ||
    ["admin", "manager", "hr", "project_manager"].includes(logInUserRole ?? "");

  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<number | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<HistoryTab>("pending");

  const isSelfView = currentUserId === data.user.id;
  const canRequestLeave = allowRequestLeave ?? isSelfView;
  const selectedYear = searchParams.get("year") || String(data.year);
  const requestCounts = {
    pending: data.requests.pending.length,
    approved: data.requests.approved.length,
    rejected: data.requests.rejected.length,
  };
  const nextHolidays = (data.next_holidays ?? []).slice(0, 3);

  const historyItems = useMemo(
    () => data.requests[activeTab],
    [activeTab, data.requests],
  );

  const headerHeading =
    headingTitle ??
    (isSelfView ? "My Leaves" : `${data.user.name} Leave History`);

  const headerSubheading =
    headingSubtitle ??
    (isSelfView
      ? `Track your leave balances, policy rules, and request history for ${data.year}.`
      : `Review ${data.user.name}'s leave balances, policy coverage, and request history for ${data.year}.`);

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year);
    params.delete("page");
    loader.start();
    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.push(nextUrl, { scroll: false });
  };

  const handleOpenRequest = (leaveTypeId?: number) => {
    if (!canRequestLeave) return;
    setSelectedLeaveTypeId(leaveTypeId ?? null);
    setRequestOpen(true);
  };

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

  const summaryCards = [
    {
      label: "Available leave",
      value: data.summary.available_leaves,
      helper: `${data.summary.available_percentage}% balance`,
      color: "#7c3aed",
    },
    {
      label: "Taken this year",
      value: data.summary.total_taken,
      helper: `${data.summary.total_remaining} days remaining`,
      color: "#f43f5e",
    },
    {
      label: "Pending requests",
      value: requestCounts.pending,
      helper: `${requestCounts.approved} approved / ${requestCounts.rejected} rejected`,
      color: "#f59e0b",
    },
    {
      label: "Approved hours",
      value: data.summary.approved_leave_hours_formatted,
      helper: "Approved leave time",
      color: "#0ea5e9",
    },
  ];

  const renderRequestCard = (request: LeaveRecord) => {
    const leaveTypeTheme = getLeaveTypeTheme(request.leaveType?.color_code);
    const statusTheme = getLeaveStatusTheme(request.status);
    const canDelete =
      canRequestLeave &&
      request.status === "pending" &&
      currentUserId === data.user.id &&
      currentUserId === request.user_id;

    return (
      <div
        key={request.id}
        className="rounded-2xl border border-borderColor bg-white p-4 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg"
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

            <div className="grid gap-3 text-sm text-subTextColor sm:grid-cols-3">
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
                <p className="text-xs uppercase tracking-[0.14em] text-subTextColor">
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
    <div className="space-y-6">
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        {requestOpen && canRequestLeave ? (
          <LeaveRequestModal
            leaveTypes={leaveTypes}
            defaultLeaveTypeId={selectedLeaveTypeId}
            onClose={() => setRequestOpen(false)}
            onSuccess={() => router.refresh()}
          />
        ) : null}
      </Dialog>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          {backHref ? (
            <Button
              asChild
              variant="outline2"
              className="w-fit dark:bg-darkPrimaryBg"
            >
              <Link href={backHref}>
                <ArrowLeft className="size-4" />
                {backLabel}
              </Link>
            </Button>
          ) : null}
          <HeadingComponent
            heading={headerHeading}
            subHeading={headerSubheading}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <YearPicker
            value={selectedYear}
            onYearChange={handleYearChange}
            startYear={new Date().getFullYear() - 1}
            endYear={new Date().getFullYear() + 1}
          />
          {resolvedCanManageUsers && showUserSelector ? (
            <SelectUserDropDown users={users} defaultSelect={false} />
          ) : null}
          {canRequestLeave ? (
            <Button onClick={() => handleOpenRequest()}>
              <Plus className="size-4" />
              New request
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="relative overflow-hidden rounded-[30px] border border-borderColor bg-[linear-gradient(135deg,#ffffff_0%,#fff8f8_50%,#f8fbff_100%)] p-6 shadow-sm dark:border-darkBorder dark:bg-[linear-gradient(135deg,rgba(50,57,71,1)_0%,rgba(33,39,51,1)_100%)]">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary dark:bg-darkPrimaryBg">
                  <Sparkles className="size-3.5" />
                  Leave overview
                </div>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-headingTextColor dark:text-darkTextPrimary">
                    {data.user.name}
                  </h2>
                  <p className="mt-2 text-sm text-subTextColor dark:text-darkTextSecondary">
                    {data.user.email}
                  </p>
                </div>
                <p className="max-w-2xl text-sm text-subTextColor dark:text-darkTextSecondary">
                  {headerSubheading}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <div className="rounded-[24px] border border-primary/10 bg-white/85 px-5 py-4 text-right shadow-sm dark:border-primary/20 dark:bg-darkPrimaryBg">
                  <p className="text-xs uppercase tracking-[0.18em] text-subTextColor">
                    Total allowed
                  </p>
                  <p className="mt-2 text-4xl font-semibold text-primary">
                    {data.summary.total_allowed}
                  </p>
                </div>
                <div className="inline-flex items-center justify-center rounded-full border border-borderColor bg-white/80 px-4 py-2 text-sm font-medium text-headingTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                  Year {selectedYear}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-[22px] border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur dark:border-darkBorder dark:bg-darkPrimaryBg"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-subTextColor">
                    {card.label}
                  </p>
                  <p
                    className="mt-3 text-2xl font-semibold"
                    style={{ color: card.color }}
                  >
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm text-subTextColor dark:text-darkTextSecondary">
                    {card.helper}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[28px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <CalendarRange className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  Team leave calendar
                </p>
                <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                  Review month-level leave activity with live leave type colors.
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="outline2"
              className="mt-5 w-full dark:bg-darkPrimaryBg"
            >
              <Link href="/leave-management/calendar">
                Open calendar
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-borderColor bg-white shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
            <div className="flex items-center gap-3 border-b border-borderColor px-5 py-4 dark:border-darkBorder">
              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
                <CalendarDays className="size-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  Next holidays
                </p>
                <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                  Upcoming company and public holidays.
                </p>
              </div>
            </div>

            {nextHolidays.length ? (
              <div className="divide-y divide-borderColor dark:divide-darkBorder">
                {nextHolidays.map((holiday, index) => (
                  <div
                    key={`${holiday.id ?? holiday.date}-${holiday.name}-${index}`}
                    className={`px-5 py-4 ${
                      index === 0 ? "bg-amber-50/70 dark:bg-amber-500/5" : ""
                    }`}
                  >
                    {index === 0 ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                        Next up
                      </p>
                    ) : null}
                    <div className="mt-1">
                      <p className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                        {holiday.name}
                      </p>
                      <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                        {formatHolidayDate(holiday.date)}
                        {formatHolidayWeekday(holiday.date)
                          ? ` · ${formatHolidayWeekday(holiday.date)}`
                          : ""}
                      </p>
                      {holiday.source ? (
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                          {holiday.source}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-subTextColor dark:text-darkTextSecondary">
                No upcoming holidays are available for the selected year.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
            Leave balances
          </h2>
          <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
            Apply against each leave type from a more compact balance view.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {leaveTypes.length ? (
            leaveTypes.map((leaveType) => {
              const theme = getLeaveTypeTheme(leaveType.color_code);
              const usedPercentage = leaveType.days_allowed
                ? Math.min(
                    (leaveType.taken / leaveType.days_allowed) * 100,
                    100,
                  )
                : 0;

              return (
                <div
                  key={leaveType.id}
                  className="rounded-[24px] border border-borderColor bg-white p-4 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg"
                  style={{
                    borderColor: theme.borderColor,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: theme.color }}
                        />
                        <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
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
                        {/* <span className="rounded-full bg-bgSecondary px-2.5 py-1 text-xs font-medium text-headingTextColor dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                          {leaveType.is_active ? "Active" : "Inactive"}
                        </span> */}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-bgSecondary px-4 py-3 text-right dark:bg-darkPrimaryBg">
                      <p className="text-xs uppercase tracking-[0.18em] text-subTextColor">
                        Left
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                        {leaveType.left}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-subTextColor">
                    <div className="flex items-center justify-between rounded-2xl bg-bgSecondary px-3 py-3 dark:bg-darkPrimaryBg">
                      <span>Min notice</span>
                      <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                        {formatNoticeDays(leaveType.min_notice_days)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-bgSecondary px-3 py-3 dark:bg-darkPrimaryBg">
                      <span>Back-dated</span>
                      <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                        {leaveType.allow_past_dates ? "Allowed" : "Blocked"}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-bgSecondary px-3 py-3 dark:bg-darkPrimaryBg">
                        <p className="text-[11px] uppercase tracking-[0.18em]">
                          Attachment
                        </p>
                        <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                          {leaveType.requires_document
                            ? "Required"
                            : "Optional"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-bgSecondary px-3 py-3 dark:bg-darkPrimaryBg">
                        <p className="text-[11px] uppercase tracking-[0.18em]">
                          Used
                        </p>
                        <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                          {leaveType.taken} of {leaveType.days_allowed}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-subTextColor">
                      {/* <span>{leaveType.approved_hours_formatted} approved</span> */}
                      {leaveType.applicable_gender !== "all" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-200">
                          <ShieldCheck className="size-3.5" />
                          {formatApplicableGender(leaveType.applicable_gender)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-bgSecondary dark:bg-darkPrimaryBg">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${usedPercentage}%`,
                          backgroundColor: theme.color,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-subTextColor">
                      <span>{leaveType.left} left</span>
                      <span>{leaveType.days_allowed} total</span>
                    </div>
                  </div>

                  {canRequestLeave ? (
                    <Button
                      variant="outline2"
                      className="mt-4 h-10 w-full rounded-xl border-borderColor bg-white text-headingTextColor hover:bg-slate-50 dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary dark:hover:bg-darkPrimaryBg"
                      onClick={() => handleOpenRequest(leaveType.id)}
                    >
                      Apply
                    </Button>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-borderColor px-4 py-3 text-sm text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
                      Leave requests can only be submitted from the employee’s
                      own account.
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-borderColor bg-white p-8 text-center text-subTextColor dark:border-darkBorder dark:bg-darkSecondaryBg dark:text-darkTextSecondary md:col-span-2 xl:col-span-4">
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-200">
                <FileWarning className="size-4" />
                No active leave types are available for this workspace yet.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[24px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
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
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
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
            <div className="rounded-2xl border border-dashed border-borderColor bg-bgSecondary/60 px-6 py-12 text-center text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg">
              No {activeTab} leave requests found for this year.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLeavesDashboard;
