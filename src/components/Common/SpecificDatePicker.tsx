/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import CalendarIcon from "../Icons/CalendarIcon";

const SpecificDatePicker = ({ selectedDate, setSelectedDate }: { selectedDate: Date, setSelectedDate: any }) => {
    // date picker
    const formatDate = (date: any) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short', // Mon
            month: 'short',   // Oct
            day: 'numeric',   // 9
            year: 'numeric',  // 2025
        });
    };
    const handleNavigate = useCallback((days: any) => {
        setSelectedDate((prevDate: string | number | Date) => {
            const newDate = new Date(prevDate);
            // setDate(getDate() + days) moves the date by the specified number of days
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        });
    }, []);

    const dateDisplay = formatDate(selectedDate);
    // date popup open
    const [open, setOpen] = useState(false)

    return (
        <div className="w-full">
            <div className="flex w-full">
                <ChevronLeft onClick={() => handleNavigate(-1)} className="border border-borderColor p-2.5 text-headingTextColor dark:text-darkTextPrimary dark:border-darkBorder dark:bg-darkPrimaryBg w-12 sm:w-10 h-10 rounded-lg cursor-pointer" />

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <div className=" flex items-center text-primary gap-2 border border-borderColor dark:border-darkBorder rounded-md px-4 mx-3 cursor-pointer w-full sm:w-auto dark:bg-darkPrimaryBg">
                            <CalendarIcon size={20} />
                            <span className="text-sm 2xl:text-base text-headingTextColor font-medium dark:text-darkTextPrimary">{dateDisplay}</span>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            captionLayout="dropdown"
                            onSelect={(selectedDate) => {
                                if (selectedDate) setSelectedDate(selectedDate)
                                setOpen(false)
                            }}
                        />
                    </PopoverContent>
                </Popover>
                <ChevronRight onClick={() => handleNavigate(1)} className="border p-2.5 text-headingTextColor dark:text-darkTextPrimary border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg w-12 sm:w-10 h-10 rounded-lg cursor-pointer" />
            </div>
        </div>
    );
};

export default SpecificDatePicker;