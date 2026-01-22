"use client"
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import CalendarIcon from "../Icons/CalendarIcon";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const SpecificDatePicker = () => {

    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Initialize state from URL if available, otherwise today
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const dateParam = searchParams.get("date");
        return dateParam ? new Date(dateParam) : new Date();
    });

    const [open, setOpen] = useState(false);

    // 1. Format date for UI display
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // 2. Sync URL params whenever the selectedDate changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        // Format as YYYY-MM-DD using local time
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        if (params.get("date") !== formattedDate) {
            params.set("date", formattedDate);
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [selectedDate, pathname, router, searchParams]);

    const handleNavigate = useCallback((days: number) => {
        setSelectedDate((prevDate) => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        });
    }, []);

    return (
        <div className="w-full">
            <div className="flex w-full items-center">
                <ChevronLeft
                    onClick={() => handleNavigate(-1)}
                    className="border border-borderColor p-2.5 text-headingTextColor dark:text-darkTextPrimary dark:border-darkBorder dark:bg-darkPrimaryBg w-12 sm:w-10 h-10 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-darkSecondaryBg"
                />

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <div className="flex h-10 items-center text-primary gap-2 border border-borderColor dark:border-darkBorder rounded-md px-4 mx-3 cursor-pointer w-full sm:w-auto dark:bg-darkPrimaryBg">
                            <CalendarIcon size={20} />
                            <span className="text-sm 2xl:text-base text-headingTextColor font-medium dark:text-darkTextPrimary whitespace-nowrap">
                                {formatDate(selectedDate)}
                            </span>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                                if (date) {
                                    setSelectedDate(date);
                                    setOpen(false);
                                }
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <ChevronRight
                    onClick={() => handleNavigate(1)}
                    className="border p-2.5 text-headingTextColor dark:text-darkTextPrimary border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg w-12 sm:w-10 h-10 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-darkSecondaryBg"
                />
            </div>
        </div>
    );
};

export default React.memo(SpecificDatePicker);