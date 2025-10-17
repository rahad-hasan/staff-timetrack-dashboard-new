/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
        <div>
            <div className="flex">
                <ChevronLeft onClick={() => handleNavigate(-1)} size={45} className="border p-2.5 border-borderColor rounded-lg cursor-pointer" />

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <div className=" flex items-center gap-2 border rounded-md px-4 mx-3 cursor-pointer">
                            <CalendarDays className=" text-primary" />
                            <span>{dateDisplay}</span>
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
                <ChevronRight onClick={() => handleNavigate(1)} size={45} className="border p-2.5 border-borderColor rounded-lg cursor-pointer" />
            </div>
        </div>
    );
};

export default SpecificDatePicker;