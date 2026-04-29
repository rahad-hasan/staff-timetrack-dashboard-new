import { Button } from "@/components/ui/button";
import { formatApplicableGender, formatNoticeDays, getLeaveTypeTheme } from "@/lib/leave";
import { LeaveRequestTypeDropdownRecord } from "@/types/type";
import { FileWarning, ShieldCheck } from "lucide-react";

type LeaveBalancesProps = {
  leaveTypes: LeaveRequestTypeDropdownRecord[];
  handleOpenRequest: (leaveTypeId?: number) => void;
  canRequestLeave: boolean;
};

const LeaveBalances = ({ leaveTypes, handleOpenRequest, canRequestLeave }: LeaveBalancesProps) => {
    return (
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
                                className="rounded-[12px] border border-borderColor p-4  dark:border-darkBorder dark:bg-darkSecondaryBg"
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
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-bgSecondary px-4 py-3 text-right dark:bg-darkPrimaryBg">
                                        <p className="text-xs uppercase tracking-[0.18em] text-subTextColor dark:text-darkTextSecondary">
                                            Left
                                        </p>
                                        <p className="mt-1 text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                            {leaveType.left}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3 text-sm text-subTextColor dark:text-darkTextSecondary">
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

                                    <div className="flex items-center justify-between text-xs text-subTextColor dark:text-darkTextSecondary">
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
                                    <div className="mt-2 flex items-center justify-between text-sm text-subTextColor dark:text-darkTextSecondary">
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
                    <div className="rounded-[12px] border border-dashed border-borderColor bg-white p-8 text-center text-subTextColor  dark:border-darkBorder dark:bg-darkSecondaryBg dark:text-darkTextSecondary md:col-span-2 xl:col-span-4">
                        <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-200">
                            <FileWarning className="size-4" />
                            No active leave types are available for this workspace yet.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveBalances;