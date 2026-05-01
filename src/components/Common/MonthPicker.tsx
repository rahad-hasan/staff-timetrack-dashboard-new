"use client"

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo } from "react";
import CalendarIcon from "../Icons/CalendarIcon";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { useTopLoader } from "nextjs-toploader";

const MonthPicker = () => {
    const loader = useTopLoader();
    // const [selectedDate, setSelectedDate] = useState(new Date());
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // // 1. Sync URL params whenever the selectedDate (month) changes
    // useEffect(() => {
    //     const params = new URLSearchParams(searchParams.toString());

    //     // Get start and end of the selected month
    //     const firstDay = startOfMonth(selectedDate);
    //     const lastDay = endOfMonth(selectedDate);

    //     // Format as YYYY-MM-DD
    //     const fromDate = format(firstDay, "yyyy-MM-dd");
    //     const toDate = format(lastDay, "yyyy-MM-dd");

    //     // Only update if the params are actually different to avoid infinite loops
    //     if (params.get("start_month") !== fromDate || params.get("end_month") !== toDate) {
    //         params.set("start_month", fromDate);
    //         params.set("end_month", toDate);

    //         // Push to URL
    //         router.push(`${pathname}?${params.toString()}`, { scroll: false });
    //     }
    // }, [selectedDate, pathname, router, searchParams]);


    const startParam = searchParams.get("start_month");

    const selectedDate = useMemo(() => {
        if (!startParam) return new Date();
        const d = new Date(startParam);
        return isNaN(d.getTime()) ? new Date() : d;
    }, [startParam]);

    const pushMonth = useCallback((targetDate: Date) => {
        const firstDay = startOfMonth(targetDate);
        const lastDay = endOfMonth(targetDate);
        const fromDate = format(firstDay, "yyyy-MM-dd");
        const toDate = format(lastDay, "yyyy-MM-dd");
        const params = new URLSearchParams(window.location.search);
        params.set("start_month", fromDate);
        params.set("end_month", toDate);
        loader.start();

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [loader, pathname, router]);

    const handleNavigate = useCallback((direction: number) => {
        pushMonth(addMonths(selectedDate, direction));
    }, [pushMonth, selectedDate]);

    const formatMonth = (date: Date) => {
        return format(date, "MMMM yyyy");
    };

    const monthDisplay = formatMonth(selectedDate);
    const currentMonthKey = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const selectedMonthKey = format(startOfMonth(selectedDate), "yyyy-MM-dd");
    const isCurrentMonth = currentMonthKey === selectedMonthKey;

    // const formatMonth = (date: Date) => {
    //     return format(date, "MMMM yyyy");
    // };

    // const handleNavigate = useCallback((months: number) => {
    //     setSelectedDate(prevDate => {
    //         const newDate = new Date(prevDate);
    //         newDate.setDate(1);
    //         newDate.setMonth(newDate.getMonth() + months);
    //         loader.start();
    //         return newDate;
    //     });
    // }, [setSelectedDate]);

    // const monthDisplay = formatMonth(selectedDate);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={() => handleNavigate(-1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-borderColor bg-white text-headingTextColor shadow-sm transition hover:-translate-y-0.5 hover:bg-bgSecondary dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary dark:hover:bg-darkSecondaryBg"
                aria-label="Previous month"
            >
                <ChevronLeft className="size-4" />
            </button>

            <div className="flex h-11 items-center gap-3 rounded-2xl border border-borderColor bg-white px-4 shadow-sm dark:border-darkBorder dark:bg-darkPrimaryBg">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarIcon size={18} />
                </span>
                <div className="leading-tight">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                        Schedule month
                    </p>
                    <span className="whitespace-nowrap text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary 2xl:text-base">
                        {monthDisplay}
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={() => handleNavigate(1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-borderColor bg-white text-headingTextColor shadow-sm transition hover:-translate-y-0.5 hover:bg-bgSecondary dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary dark:hover:bg-darkSecondaryBg"
                aria-label="Next month"
            >
                <ChevronRight className="size-4" />
            </button>

            {!isCurrentMonth && (
                <button
                    type="button"
                    onClick={() => pushMonth(new Date())}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/8 px-4 text-sm font-medium text-primary transition hover:bg-primary/12"
                >
                    Current month
                </button>
            )}
            {isCurrentMonth && (
                <div className="inline-flex h-11 items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    This month
                </div>
            )}
        </div>
    );
};

export default MonthPicker;
