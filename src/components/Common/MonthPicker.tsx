/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import CalendarIcon from "../Icons/CalendarIcon";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format, startOfMonth, endOfMonth, addMonths, setMonth, setYear } from "date-fns";
import { useTopLoader } from "nextjs-toploader";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const MonthPicker = () => {
    const loader = useTopLoader();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const startParam = searchParams.get("start_month");

    const selectedDate = useMemo(() => {
        if (!startParam) return new Date();
        const d = new Date(startParam);
        return isNaN(d.getTime()) ? new Date() : d;
    }, [startParam]);

    const [gridYear, setGridYear] = useState<number>(selectedDate.getFullYear());

    const updateUrlParams = (nextDate: Date) => {
        const firstDay = startOfMonth(nextDate);
        const lastDay = endOfMonth(nextDate);

        const fromDate = format(firstDay, "yyyy-MM-dd");
        const toDate = format(lastDay, "yyyy-MM-dd");

        const params = new URLSearchParams(window.location.search);
        params.set("start_month", fromDate);
        params.set("end_month", toDate);

        loader.start();
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleNavigate = useCallback((direction: number) => {
        const nextDate = addMonths(selectedDate, direction);
        setGridYear(nextDate.getFullYear());
        updateUrlParams(nextDate);
    }, [selectedDate, pathname, router]);

    const handleYearChange = (direction: number) => {
        setGridYear((prev) => prev + direction);
    };

    const handleMonthSelect = (monthIndex: number) => {
        let nextDate = setYear(selectedDate, gridYear);
        nextDate = setMonth(nextDate, monthIndex);
        updateUrlParams(nextDate);
        setIsOpen(false);
    };

    const monthDisplay = format(selectedDate, "MMM yyyy");

    const monthsShort = [
        "Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sep", "Oct", "Nov", "Dec"
    ];

    return (
        <div className="relative inline-block text-left">
            <div className="flex items-center">
                <ChevronLeft
                    onClick={() => handleNavigate(-1)}
                    className="border p-2.5 w-12 sm:w-10 h-10 dark:bg-darkPrimaryBg border-borderColor dark:border-darkBorder text-headingTextColor dark:text-darkTextPrimary rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-darkSecondaryBg transition-colors"
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            onClick={() => {
                                setGridYear(selectedDate.getFullYear());
                                setIsOpen(!isOpen);
                            }}
                            className="flex items-center cursor-pointer text-primary gap-2 border rounded-md px-4 mx-2 h-10 w-full sm:w-auto border-borderColor dark:border-darkBorder bg-white dark:bg-darkPrimaryBg hover:bg-gray-50 dark:hover:bg-darkSecondaryBg transition-colors"
                        >
                            <CalendarIcon size={20} />
                            <span className="text-sm 2xl:text-base text-headingTextColor font-medium dark:text-darkTextPrimary whitespace-nowrap">
                                {monthDisplay}
                            </span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-58 p-4">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <button
                                onClick={() => handleYearChange(-1)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-md hover:bg-gray-100 dark:hover:bg-darkSecondaryBg"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-base font-bold text-headingTextColor dark:text-darkTextPrimary">
                                {gridYear}
                            </span>
                            <button
                                onClick={() => handleYearChange(1)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-md hover:bg-gray-100 dark:hover:bg-darkSecondaryBg"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
                            {monthsShort.map((monthLabel, index) => {
                                const isCurrentSelected =
                                    selectedDate.getMonth() === index &&
                                    selectedDate.getFullYear() === gridYear;

                                return (
                                    <button
                                        key={monthLabel}
                                        onClick={() => handleMonthSelect(index)}
                                        className={`py-1 text-sm font-medium rounded-lg transition-all cursor-pointer ${isCurrentSelected
                                            ? "bg-primary text-white dark:text-black font-semibold shadow-md"
                                            : "text-headingTextColor dark:text-darkTextPrimary hover:bg-gray-100 dark:hover:bg-darkSecondaryBg"
                                            }`}
                                    >
                                        {monthLabel}
                                    </button>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>

                <ChevronRight
                    onClick={() => handleNavigate(1)}
                    className="border p-2.5 w-12 sm:w-10 h-10 dark:bg-darkPrimaryBg border-borderColor dark:border-darkBorder text-headingTextColor dark:text-darkTextPrimary rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-darkSecondaryBg transition-colors"
                />
            </div>

        </div>
    );
};

export default MonthPicker;