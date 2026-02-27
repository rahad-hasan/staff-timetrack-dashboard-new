/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
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

    // 1. Sync URL params whenever the selectedDate (month) changes
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



    const [selectedDate, setSelectedDate] = useState(() => {
        const start = searchParams.get("start_month");
        return start ? new Date(start) : new Date();
    });

    const handleNavigate = useCallback((direction: number) => {
        // 1. Calculate the NEW date based on current state
        const nextDate = addMonths(selectedDate, direction);

        // 2. Derive the new month boundaries
        const firstDay = startOfMonth(nextDate);
        const lastDay = endOfMonth(nextDate);

        const fromDate = format(firstDay, "yyyy-MM-dd");
        const toDate = format(lastDay, "yyyy-MM-dd");

        // 3. Update the URL
        const params = new URLSearchParams(searchParams.toString());
        params.set("start_month", fromDate);
        params.set("end_month", toDate);

        loader.start();
        router.push(`${pathname}?${params.toString()}`, { scroll: false });

        // 4. Finally, update the local state to match
        setSelectedDate(nextDate);
    }, [selectedDate, pathname, router, searchParams]);

    const formatMonth = (date: Date) => {
        return format(date, "MMMM yyyy");
    };

    const monthDisplay = formatMonth(selectedDate);

    return (
        <div className="flex ">
            <ChevronLeft
                onClick={() => handleNavigate(-1)}
                className="border p-2.5 w-12 sm:w-10 h-10 dark:bg-darkPrimaryBg border-borderColor dark:border-darkBorder text-headingTextColor dark:text-darkTextPrimary rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-darkSecondaryBg"
            />
            <div className="flex items-center text-primary gap-2 border rounded-md px-4 mx-2 w-full sm:w-auto border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg">
                <CalendarIcon size={20} />
                <span className="text-sm 2xl:text-base text-headingTextColor font-medium dark:text-darkTextPrimary whitespace-nowrap">
                    {monthDisplay}
                </span>
            </div>
            <ChevronRight
                onClick={() => handleNavigate(1)}
                className="border p-2.5 w-12 sm:w-10 h-10 dark:bg-darkPrimaryBg border-borderColor dark:border-darkBorder text-headingTextColor dark:text-darkTextPrimary rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-darkSecondaryBg"
            />
        </div>
    );
};

export default MonthPicker;