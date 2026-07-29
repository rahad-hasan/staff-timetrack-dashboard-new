/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarClock, ArrowUpRight, Users2 } from "lucide-react";
import { getLeaveTypeTheme } from "@/lib/leave";
import EmptyTableRow from "@/components/Common/EmptyTableRow";

type Props = {
    filteredUsers: any[];
};

const EmployeeLeaveCoverageList = ({ filteredUsers }: Props) => {

    return (
        <div className="space-y-4">
            {filteredUsers.length ? (
                filteredUsers.map((row) => (
                    <div
                        key={row.user.id}
                        className="rounded-[12px] border border-borderColor bg-bgSecondary/50 p-5 dark:border-darkBorder dark:bg-darkPrimaryBg"
                    >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <Link
                                href={`/leave-management/user-leave-history/${row.user.id}`}
                                className="flex items-center gap-3"
                            >
                                <Avatar className="size-11">
                                    <AvatarImage src={row.user.image ?? ""} alt={row.user.name} />
                                    <AvatarFallback>{row.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                        {row.user.name}
                                    </p>
                                    <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                                        {row.user.email}
                                    </p>
                                </div>
                            </Link>

                            <div className="grid gap-3 sm:grid-cols-4">
                                <div className="rounded-2xl bg-white px-4 py-3 text-sm dark:bg-darkSecondaryBg">
                                    <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                                        Allowed
                                    </p>
                                    <p className="mt-1 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                        {row.total_allowed}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-white px-4 py-3 text-sm dark:bg-darkSecondaryBg">
                                    <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                                        Taken
                                    </p>
                                    <p className="mt-1 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                        {row.total_taken}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-white px-4 py-3 text-sm dark:bg-darkSecondaryBg">
                                    <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                                        Remaining
                                    </p>
                                    <p className="mt-1 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                        {row.total_remaining}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-white px-4 py-3 text-sm dark:bg-darkSecondaryBg">
                                    <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                                        Approved hours
                                    </p>
                                    <p className="mt-1 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                        {row.approved_leave_hours_formatted}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {row.leave_types.length ? (
                                row.leave_types.map((leaveType: any) => {
                                    const theme = getLeaveTypeTheme(leaveType.color_code);

                                    return (
                                        <div
                                            key={leaveType.id}
                                            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
                                            style={{
                                                backgroundColor: theme.backgroundColor,
                                                color: theme.textColor,
                                            }}
                                        >
                                            <span
                                                className="h-2.5 w-2.5 rounded-full"
                                                style={{ backgroundColor: theme.color }}
                                            />
                                            <span>{leaveType.title}</span>
                                            <span className="opacity-70">
                                                {leaveType.remaining}/{leaveType.allowed}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-subTextColor dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
                                    <Users2 className="size-4" />
                                    No leave type summary available for this user.
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 dark:bg-darkSecondaryBg">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                                    <CalendarClock className="size-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                        Leave history detail
                                    </p>
                                    <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                                        Open the employee’s dashboard-style leave history page.
                                    </p>
                                </div>
                            </div>
                            <Button asChild variant="outline2" className="dark:bg-darkPrimaryBg">
                                <Link href={`/leave-management/user-leave-history/${row.user.id}`}>
                                    Open history
                                    <ArrowUpRight className="size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                ))
            ) : (
                <div className=" flex justify-center h-68">
                    <EmptyTableRow columns={2} text={`No employees matched the current search.`}></EmptyTableRow>
                </div>
            )}
        </div>
    );
};

export default EmployeeLeaveCoverageList;