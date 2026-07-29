"use client"
import CalendarIcon from "@/components/Icons/CalendarIcon";
import LeaveCalender from "@/components/Icons/LeaveCalender";
import { UserLeaveSummary } from "@/types/type";
import { format, isValid, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";

type LeaveOverviewProps = {
    data: UserLeaveSummary;
    headingSubtitle?: string;
    currentUserId?: number;
};

const LeaveOverview = ({ data, headingSubtitle, currentUserId }: LeaveOverviewProps) => {

    const searchParams = useSearchParams();
    const selectedYear = searchParams.get("year") || String(data.year);
    const isSelfView = currentUserId === data.user.id;
    const headerSubheading =
        headingSubtitle ??
        (isSelfView
            ? `Track your leave balances, policy rules, and request history for ${data.year}.`
            : `Review ${data.user.name}'s leave balances, policy coverage, and request history for ${data.year}.`);

    const requestCounts = {
        pending: data.requests.pending.length,
        approved: data.requests.approved.length,
        rejected: data.requests.rejected.length,
    };
    const nextHolidays = (data.next_holidays ?? []).slice(0, 3);
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

    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="relative overflow-hidden rounded-[12px] border border-borderColor bg-[linear-gradient(135deg,#ffffff_0%,#fff8f8_50%,#f8fbff_100%)] p-5 dark:border-darkBorder dark:bg-[linear-gradient(135deg,rgba(50,57,71,1)_0%,rgba(33,39,51,1)_100%)]">
                <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative flex flex-col justify-between h-full">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary dark:bg-darkPrimaryBg">
                                {/* <Sparkles className="size-3.5" /> */}
                                <LeaveCalender size={14} />
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
                            <div className="rounded-[12px] border border-primary/10 bg-white/85 px-5 py-4 text-right dark:border-primary/20 dark:bg-darkPrimaryBg">
                                <p className="text-xs uppercase tracking-[0.18em] text-subTextColor dark:text-darkTextSecondary">
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
                                className="rounded-[12px] border border-white bg-white/80 px-4 py-6 shadow-sm backdrop-blur dark:border-darkBorder dark:bg-darkPrimaryBg"
                            >
                                <p className="text-xs uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                                    {card.label}
                                </p>
                                <p
                                    className="mt-3 text-4xl font-black opacity-90"
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
                {/* <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
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
                        className="mt-5 w-full dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                    >
                        <Link href="/leave-management/calendar">
                            Open calendar
                            <ChevronRight className="size-4" />
                        </Link>
                    </Button>
                </div> */}

                <div className="overflow-hidden rounded-[12px] border border-borderColor dark:border-darkBorder dark:bg-darkSecondaryBg">
                    <div className="flex items-center gap-3 border-b border-borderColor px-5 py-4 dark:border-darkBorder">
                        <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
                            <CalendarIcon size={20} />
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
                                    className={`px-5 py-3 ${index === 0 ? "bg-amber-50/70 dark:bg-amber-500/5" : ""
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
    );
};

export default LeaveOverview;