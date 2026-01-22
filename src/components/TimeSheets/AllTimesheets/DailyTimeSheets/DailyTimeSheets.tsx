/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import DailyTimeSheetsTable from "./DailyTimeSheetsTable";
import { format, parseISO } from "date-fns";

const DailyTimeSheets = ({ data, timeLineData, selectedDate }: { data: any, timeLineData: any, selectedDate: string | number | string[] | undefined }) => {

    const getDecimalHour = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return hours + (minutes / 60);
    };

    // Helper to format duration from decimal to HH:MM:SS
    const formatDuration = (decimalHours: number) => {
        const totalSeconds = Math.floor(decimalHours * 3600);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // Transform backend data into activePeriods
    const activePeriods = (timeLineData || []).map((entry: any) => ({
        start: getDecimalHour(entry.start_time),
        end: getDecimalHour(entry.end_time),
        startTime: entry.start_time,
        endTime: entry.end_time,
        project: entry.project?.name || "No Project",
        task: entry.task?.name || "No Task",
        duration: formatDuration(entry.duration)
    }));

    const getDayProgressPercentage = () => {
        const now = new Date();

        // 1. Format "Today" to YYYY-MM-DD to match your URL param
        const todayString = now.toISOString().split('T')[0];

        // 2. If the selected date is NOT today, return 0 (or 100 for past days)
        if (selectedDate !== todayString) {
            // If it's a past date, we show 100% progress. If future, 0%.
            return selectedDate! < todayString ? 100 : 0;
        }
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const totalMinutesPassed = (hours * 60) + minutes;
        const totalMinutesInDay = 24 * 60;
        return (totalMinutesPassed / totalMinutesInDay) * 100;
    };
    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    const dayProgress = getDayProgressPercentage();

    return (
        <>
            <div className=" mb-5">
                <div className=" flex gap-2 mb-2">
                    <h1 className=" font-bold text-headingTextColor dark:text-darkTextPrimary">Today:</h1>
                    <p className="text-headingTextColor dark:text-darkTextPrimary">{data?.totals?.duration_formatted}</p>
                </div>
                <div className={`relative h-5 ${isToday ? "bg-[#dce3e3]" : "bg-[#f6f7f9]"}  dark:bg-darkPrimaryBg rounded-4xl outline outline-borderColor dark:outline-darkBorder`}>

                    {
                        isToday &&
                        <div
                            className="absolute h-5 bg-[#f6f7f9] dark:bg-darkSecondaryBg rounded-l-4xl border-r-3 border-[#bdbfbe] dark:border-[#afafaf]"
                            style={{
                                left: `0%`,
                                width: `${dayProgress}%`,
                            }}
                        ></div>
                    }

                    {activePeriods?.map((period: any, index: number) => {
                        const startPercent = (period.start / 24) * 100;
                        const endPercent = (period.end / 24) * 100;
                        const width = endPercent - startPercent;

                        return (
                            <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                    <div
                                        key={index}
                                        className="absolute h-5 bg-primary rounded-4xl z-50"
                                        style={{
                                            left: `${startPercent}%`,
                                            width: `${width}%`,
                                        }}
                                    ></div>
                                </TooltipTrigger>
                                <TooltipContent className=" p-3">
                                    <div>
                                        <h2 className=" text-[15px] mb-2 text-headingTextColor dark:text-darkTextPrimary">Project: {period?.project}</h2>
                                        <h2 className=" text-[15px] mb-2 text-headingTextColor dark:text-darkTextPrimary">Task: {period?.task}</h2>
                                        <h2 className=" text-[15px] mb-2 text-headingTextColor dark:text-darkTextPrimary">Duration: {period?.duration}</h2>
                                        <h2 className=" text-[15px] mb-2 text-headingTextColor dark:text-darkTextPrimary">Start Time: {format(parseISO(period?.startTime), "hh:mm aa")}</h2>
                                        <h2 className=" text-[15px] text-headingTextColor dark:text-darkTextPrimary">End Time: {format(parseISO(period?.endTime), "hh:mm aa")}</h2>
                                    </div>
                                </TooltipContent>
                            </Tooltip>

                        );
                    })}
                </div>
                {/* <div className="flex justify-between mt-[2px]">
                    {Array.from({ length: 24 }, (_, i) => {
                        const hour = i + 1;
                        // choose which hours to always show
                        const isAlwaysVisible = hour === 1 || hour === 6 || hour === 12 || hour === 18 || hour === 24;

                        return (
                            <span
                                key={i}
                                className={`text-sm text-gray-400 dark:text-darkTextSecondary
                                ${!isAlwaysVisible ? "hidden lg:inline xl:inline" : ""}
                                sm:first:ml-1
                                `}
                            >
                                {hour}h
                            </span>
                        );
                    })}
                </div> */}
                <div className="flex justify-between mt-[2px]">
                    {Array.from({ length: 24 }, (_, i) => {
                        const hour = i + 1;
                        // choose which hours to always show
                        const isAlwaysVisible = hour === 1 || hour === 6 || hour === 12 || hour === 18 || hour === 24;

                        return (
                            <span
                                key={i}
                                className={`text-sm text-gray-400 dark:text-darkTextSecondary
                                ${!isAlwaysVisible ? "hidden lg:inline xl:inline" : ""}
                                sm:first:ml-1
                                `}
                            >
                                {hour}h
                            </span>
                        );
                    })}
                </div>

            </div>
            <DailyTimeSheetsTable data={data?.items}></DailyTimeSheetsTable>

        </>
    );
};

export default DailyTimeSheets;