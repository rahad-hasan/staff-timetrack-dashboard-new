/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import DailyTimeSheetsTable from "./DailyTimeSheetsTable";
import { formatTZDate, formatTZTime, getTZDecimalHour } from "@/utils";

const DailyTimeSheets = ({ data, timeLineData, selectedDate }: { data: any, timeLineData: any, selectedDate: string | number | string[] | undefined }) => {

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
        start: getTZDecimalHour(entry.start_time),
        end: getTZDecimalHour(entry.end_time),
        startTime: entry.start_time,
        endTime: entry.end_time,
        project: entry.project?.name || "No Project",
        task: entry.task?.name || "No Task",
        duration: formatDuration(entry.duration)
    }));

    // 2. Logic for Day Progress Line
    const getDayProgressPercentage = () => {
        const now = new Date();
        const todayString = formatTZDate(now); // Match selectedDate format using TZ

        if (selectedDate !== todayString) {
            return selectedDate! < todayString ? 100 : 0;
        }

        // Get the current decimal hour in the user's timezone
        const decimalHourNow = getTZDecimalHour(now);
        return (decimalHourNow / 24) * 100;
    };

    const isToday = selectedDate === formatTZDate(new Date());
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
                                        <h2 className=" text-[15px] mb-2 text-headingTextColor dark:text-darkTextPrimary">Start Time: {formatTZTime(period?.startTime)}</h2>
                                        <h2 className=" text-[15px] text-headingTextColor dark:text-darkTextPrimary">End Time: {formatTZTime(period?.endTime)}</h2>
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