"use client"

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, Dispatch, SetStateAction } from "react";

const MonthPicker = ({ selectedDate, setSelectedDate }: { selectedDate: Date; setSelectedDate: Dispatch<SetStateAction<Date>>; }) => {
    // month picker
    const formatMonth = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',  // 2025
            month: 'long',    // October
        });
    };

    const handleNavigate = useCallback((months: number) => {
        setSelectedDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + months);
            return newDate;
        });
    }, []);

    const monthDisplay = formatMonth(selectedDate);

    console.log("Selected Month:", monthDisplay);
    return (
        <div className="flex w-full">
            <ChevronLeft
                onClick={() => handleNavigate(-1)}
                className="border p-2.5  w-12 sm:w-10 h-10 border-borderColor rounded-lg cursor-pointer"
            />
            <div className="flex items-center gap-2 border rounded-md px-4 mx-3 w-full sm:w-auto">
                <Calendar className="text-primary" />
                <span>{monthDisplay}</span>
            </div>
            <ChevronRight
                onClick={() => handleNavigate(1)}
                className="border p-2.5 w-12 sm:w-10 h-10 border-borderColor rounded-lg cursor-pointer"
            />
        </div>
    );
};

export default MonthPicker;