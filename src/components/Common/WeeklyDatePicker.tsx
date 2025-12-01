/* eslint-disable @typescript-eslint/no-explicit-any */
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, Dispatch, SetStateAction } from "react";


interface WeeklyDatePickerProps {
    centerDate: Date;
    setCenterDate: Dispatch<SetStateAction<Date>>;
}

const WeeklyDatePicker = ({ centerDate, setCenterDate }: WeeklyDatePickerProps) => {

    const formatDate = (date: any) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short', // Mon
            month: 'short',   // Oct
            day: 'numeric',   // 9
            year: 'numeric',  // 2025
        });
    };

    const handleNavigate = useCallback((weeks: number) => {
        setCenterDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + (weeks * 7));
            return newDate;
        });
    }, [setCenterDate]);

    const getWeekRange = (centerDate: Date) => {
        const date = new Date(centerDate.getTime());
        console.log('date', date);
        const dayOfWeek = date.getDay();
        console.log('getDay', dayOfWeek);

        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        // Sunday 0, Monday 1, Tuesday 2, Wednesday 3, Thursday 4, Friday 5, and Saturday 6
        // 3-1 = 2 

        const startOfWeek = new Date(date.setDate(date.getDate() - diffToMonday));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return { startOfWeek, endOfWeek };
    };

    const { startOfWeek, endOfWeek } = getWeekRange(centerDate);

    const dateDisplay = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;

    console.log("Start Date:", startOfWeek.toISOString());
    console.log("End Date:", endOfWeek.toISOString());
    return (
        <div className="flex">
            <ChevronLeft onClick={() => handleNavigate(-1)} className="border p-2.5 w-10 h-10 dark:bg-darkPrimaryBg border-borderColor dark:border-darkBorder text-headingTextColor dark:text-darkTextPrimary rounded-lg cursor-pointer" />
            <div className=" flex items-center gap-2 border dark:border-darkBorder dark:bg-darkPrimaryBg rounded-md px-2 sm:px-4 mx-3">
                <Calendar className=" text-primary w-5.5" />
                <span className="text-sm sm:text-[16px] font-medium text-headingTextColor dark:text-darkTextPrimary">{dateDisplay}</span>
            </div>
            <ChevronRight onClick={() => handleNavigate(1)} className="border p-2.5 w-10 h-10 dark:bg-darkPrimaryBg border-borderColor dark:border-darkBorder text-headingTextColor dark:text-darkTextPrimary rounded-lg cursor-pointer" />
        </div>
    );
};

export default WeeklyDatePicker;