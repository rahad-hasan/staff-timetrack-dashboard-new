/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getDay, parseISO } from "date-fns";
import { useState } from "react";

const MonthlyTimeSheetsCalendar = ({ data }: any) => {

    console.log(data);

    const [viewType, setViewType] = useState("Hours");
    
    // 1. Process the new "daily_data" array format
    const dailyData = data?.daily_data || [];

    const getPaddingCells = () => {
        if (dailyData.length === 0) return [];
        // Get the first date from the new array structure
        const firstDate = parseISO(dailyData[0].date);
        const dayOfWeek = getDay(firstDate); // 0 (Sun) to 6 (Sat)

        // Adjust for Monday start: Mon=0, Tue=1 ... Sun=6
        const paddingCount = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        return Array(paddingCount).fill(null);
    };

    const paddingCells = getPaddingCells();
    const dayHeaders = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

    const DateCell = ({
        dateString,
        dayNumber,
        formattedTime,
        activity, // Changed from duration to match new data key
        isPadding
    }: {
        dateString?: string,
        dayNumber?: number,
        formattedTime?: string,
        activity?: number,
        isPadding?: boolean
    }) => (
        <div
            className={`p-3 h-28 md:h-24 flex flex-col justify-center items-center border border-gray-200 bg-bgPrimary dark:bg-darkPrimaryBg text-headingTextColor dark:text-darkTextPrimary dark:border-darkBorder`}
        >
            {/* Render nothing for padding cells to keep your original layout empty */}
            {!isPadding && (
                <>
                    <span className="font-medium text-lg mb-1">{dayNumber}</span>
                    {
                        viewType === "Hours" ?
                            <div>
                                {formattedTime && (
                                    <div className="px-2 py-1 text-sm font-medium rounded-lg bg-primary/5 dark:bg-darkSecondaryBg text-primary shadow-sm">
                                        {formattedTime}
                                    </div>
                                )}
                            </div>
                            :
                            <div>
                                {/* Using 'activity' from new data format */}
                                <div className="px-2 py-1 text-sm font-medium rounded-lg bg-primary/5 dark:bg-darkSecondaryBg text-primary shadow-sm">
                                    {`${activity || 0}%`}
                                </div>
                            </div>
                    }
                </>
            )}
        </div>
    );

    const DayHeader = ({ day, className }: { day: string; className?: string }) => (
        <div className={`p-3 flex items-center justify-center font-bold text-sm h-14 bg-bgSecondary  dark:bg-darkSecondaryBg text-headingTextColor dark:text-darkTextPrimary ${className}`}>
            {day}
        </div>
    );

    return (
        <div>
            <div className=" mb-5 flex flex-col gap-4 md:gap-0 md:flex-row justify-between">
                <div className=" flex items-center gap-3 md:gap-5 ">
                    <div className=" flex items-center gap-0.5 md:gap-2">
                        <h2 className=" font-medium text-headingTextColor dark:text-darkTextPrimary">Total Hour:</h2>
                        <h2 className="text-headingTextColor dark:text-darkTextPrimary">{data?.total_time}</h2>
                    </div>
                    <div className=" flex items-center gap-0.5 md:gap-2">
                        <h2 className=" font-medium text-headingTextColor dark:text-darkTextPrimary">Monthly Activity:</h2>
                        <h2 className="text-headingTextColor dark:text-darkTextPrimary">{data?.activity}%</h2>
                    </div>
                </div>
                <div className=" flex items-center gap-2 ">
                    <p className=" font-medium text-headingTextColor dark:text-darkTextPrimary">Select Option: </p>
                    <div className="  dark:bg-darkPrimaryBg rounded-lg">
                        <Select onValueChange={(value) => setViewType(value)} defaultValue="Hours">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select An Option" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup className=" dark:bg-darkSecondaryBg">
                                    <SelectItem className=" cursor-pointer" value="Hours">Hours</SelectItem>
                                    <SelectItem className=" cursor-pointer" value="Activity">Activity</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className=" overflow-auto ">
                <div className="grid grid-cols-7 gap-2 min-w-[750px]">
                    {/* Headers */}
                    {dayHeaders.map((day, index) => {
                        let extraClass = "";
                        if (index === 0) extraClass = "rounded-tl-lg";
                        if (index === dayHeaders.length - 1) extraClass = "rounded-tr-lg";

                        return (
                            <div key={day} >
                                <DayHeader day={day} className={extraClass} />
                            </div>
                        );
                    })}
                    
                    {/* Empty Padding Cells */}
                    {paddingCells.map((_, index) => (
                        <DateCell key={`pad-${index}`} isPadding={true} />
                    ))}

                    {/* Mapping through new daily_data array */}
                    {dailyData?.map((dayItem: any) => {
                        const dateObj = parseISO(dayItem?.date);
                        return (
                            <DateCell
                                key={dayItem?.date}
                                dateString={dayItem?.date}
                                dayNumber={dateObj.getDate()}
                                formattedTime={dayItem?.duration}
                                activity={dayItem?.activity}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MonthlyTimeSheetsCalendar;