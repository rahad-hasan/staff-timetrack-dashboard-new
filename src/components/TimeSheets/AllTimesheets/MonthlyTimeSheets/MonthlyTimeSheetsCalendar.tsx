"use client"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState } from "react";

const MonthlyTimeSheetsCalendar = () => {

    const [viewType, setViewType] = useState("Hours");

    const mockCalendarData = [
        { day: 1, time: "8h 56m", activity: 90.05 },
        { day: 2, time: "8h 23m", activity: 87.42 },
        { day: 3, time: "8h 4m", activity: 85.13 },
        { day: 4, time: "9h 11m", activity: 92.27 },
        { day: 5, time: "8h 2m", activity: 84.67 },
        { day: 6, time: "", activity: null },
        { day: 7, time: "", activity: null },
        { day: 8, time: "8h 28m", activity: 88.25 },
        { day: 9, time: "10h 30m", activity: 94.53 },
        { day: 10, time: "8h 19m", activity: 86.34 },
        { day: 11, time: "8h 8m", activity: 85.71 },
        { day: 12, time: "6h 54m", activity: 78.12 },
        { day: 13, time: "", activity: null },
        { day: 14, time: "0h 4m", activity: 12.41 },
        { day: 15, time: "9h 23m", activity: 91.56 },
        { day: 16, time: "8h 20m", activity: 86.45 },
        { day: 17, time: "8h 37m", activity: 87.95 },
        { day: 18, time: "8h 36m", activity: 87.74 },
        { day: 19, time: "8h 15m", activity: 85.32 },
        { day: 20, time: "0h 23m", activity: 18.42 },
        { day: 21, time: "3h 51m", activity: 53.25 },
        { day: 22, time: "8h 2m", activity: 84.66 },
        { day: 23, time: "8h 23m", activity: 86.92 },
        { day: 24, time: "3h 14m", activity: 47.33 },
        { day: 25, time: "8h 16m", activity: 85.87 },
        { day: 26, time: "6h 11m", activity: 76.25 },
        { day: 27, time: "1h 9m", activity: 31.42 },
        { day: 28, time: "", activity: null },
        { day: 29, time: "", activity: null },
        { day: 30, time: "3h 30m", activity: 50.71 },
        { day: 31, time: "3h 14m", activity: 47.11 },
    ];

    const dayHeaders = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

    const DateCell = ({ day, time, activity }: { day: number, time: string, activity: number | null }) => (
        <div
            className={`p-3 h-28 md:h-24 flex flex-col justify-center items-center border border-gray-200 bg-bgPrimary dark:bg-darkPrimaryBg text-headingTextColor dark:text-darkTextPrimary dark:border-darkBorder`}
        >
            <span className="font-semibold text-lg mb-1">{day}</span>
            {
                viewType === "Hours" ?
                    <div>
                        {time && (
                            <div className="px-2 py-1 text-sm font-medium rounded-lg bg-primary/5 dark:bg-darkSecondaryBg text-primary shadow-sm">
                                {time}
                            </div>
                        )}
                    </div>
                    :
                    <div>
                        {activity && (
                            <div className="px-2 py-1 text-sm font-medium rounded-lg bg-primary dark:bg-darkSecondaryBg text-primary shadow-sm">
                                {activity}%
                            </div>
                        )}
                    </div>
            }
        </div>
    );

    const DayHeader = ({ day, className }: { day: string; className?: string }) => (
        <div className={`p-3 flex items-center justify-center font-bold text-sm h-14 border bg-[#e8eaec] border-[#00000010] dark:bg-darkSecondaryBg text-headingTextColor dark:text-darkTextPrimary ${className}`}>
            {day}
        </div>
    );

    return (
        <div>
            <div className=" mb-5 flex flex-col gap-4 md:gap-0 md:flex-row justify-between">
                <div className=" flex items-center gap-3 md:gap-5 ">
                    <div className=" flex items-center gap-0.5 md:gap-2">
                        <h2 className=" font-semibold text-headingTextColor dark:text-darkTextPrimary">Total Hour:</h2>
                        <h2 className="text-headingTextColor dark:text-darkTextPrimary">32:25:00</h2>
                    </div>
                    <div className=" flex items-center gap-0.5 md:gap-2">
                        <h2 className=" font-semibold text-headingTextColor dark:text-darkTextPrimary">Monthly Activity:</h2>
                        <h2 className="text-headingTextColor dark:text-darkTextPrimary">75.56%</h2>
                    </div>
                </div>
                <div className=" flex items-center gap-2 ">
                    <p className=" font-semibold text-headingTextColor dark:text-darkTextPrimary">Select Option: </p>
                    <div className=" bg-bgSecondary dark:bg-darkPrimaryBg rounded-lg">
                        <Select onValueChange={(value) => setViewType(value)} defaultValue="Hours">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select An Option" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup className="bg-bgSecondary dark:bg-darkSecondaryBg">
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

                    {mockCalendarData.map((data) => (
                        <div key={data.day} >
                            <DateCell day={data.day} time={data.time} activity={data?.activity} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MonthlyTimeSheetsCalendar;
