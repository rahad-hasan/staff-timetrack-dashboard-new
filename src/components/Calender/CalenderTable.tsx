import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import Image from "next/image";
import { Dialog, DialogTrigger } from "../ui/dialog";
import EditEventModal from "./EditEventModal";

const CalenderTable = () => {
    type DayMeta = { name: string };
    const days: DayMeta[] = [
        { name: 'MON' },
        { name: 'TUE' },
        { name: 'WED' },
        { name: 'THU' },
        { name: 'FRI' },
        { name: 'SAT' },
        { name: 'SUN' },
    ];
    interface CalendarDay {
        date: number;
        time: string | null;
        event?: string[];
    }
    const calendarData: CalendarDay[] = [
        // Week 1
        { date: 29, time: null }, { date: 30, time: null }, { date: 1, time: '-' }, { date: 2, time: '8h 0m' },
        { date: 3, time: '8h 0m' }, { date: 4, time: '8h 0m' }, { date: 5, time: '8h 0m' },
        // Week 2
        { date: 6, time: '8h 0m' }, { date: 7, time: '8h 0m', event: ["Teams Meeting", "TownHall Conference"] }, { date: 8, time: '8h 0m' }, { date: 9, time: null },
        { date: 10, time: null }, { date: 11, time: null }, { date: 12, time: null },
        // Week 3
        { date: 13, time: null, event: ["Teams Meeting", "TownHall Conference", "tradeshows", "product launches", "networking events"] }, { date: 14, time: null }, { date: 15, time: null }, { date: 16, time: null },
        { date: 17, time: null }, { date: 18, time: null }, { date: 19, time: null },
        // Week 4
        { date: 20, time: null }, { date: 21, time: null }, { date: 22, time: null }, { date: 23, time: null },
        { date: 24, time: null }, { date: 25, time: null }, { date: 26, time: null },
        // Week 5
        { date: 27, time: null }, { date: 28, time: null }, { date: 29, time: null }, { date: 30, time: null },
        { date: 31, time: null }, { date: 1, time: null }, { date: 2, time: null },
    ];

    const ROWS_PER_WEEK = 7;


    const chunkArray = (array: CalendarDay[], chunkSize: number) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    };

    const weeks = chunkArray(calendarData, ROWS_PER_WEEK);
    console.log(weeks);

    const pillBaseClasses = 'self-start ml-2 px-3 py-1 text-sm rounded-md font-medium text-center truncate shadow-sm mt-1 cursor-pointer';

    return (
        <div className="">

            <div className="overflow-x-auto rounded-2xl border border-borderColor dark:border-darkBorder mt-5">
                <table className="w-full border-collapse ">
                    <thead className="bg-white dark:bg-darkSecondaryBg">
                        <tr>
                            {days.map((d, i) => (
                                <th
                                    key={i}
                                    className={`
                                        px-4 py-4 sm:text-xl font-bold text-headingTextColor dark:text-darkTextPrimary
                                        border-b border-gray-200 dark:border-darkBorder ${i < days.length - 1 ? 'border-r border-gray-200 dark:border-darkBorder' : ''}
                                    `}
                                >
                                    {d.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-darkSecondaryBg">
                        {weeks.map((week, weekIndex) => (
                            <tr key={weekIndex} className="h-26">
                                {week.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={` w-[14.285%]
                                            ${weekIndex < weeks.length - 1 ? 'border-b border-gray-200 dark:border-darkBorder' : ''} 
                                            ${cellIndex < week.length - 1 ? 'border-r border-gray-200 dark:border-darkBorder' : ''}
                                        `}
                                    >
                                        <div className=" flex flex-col items-center h-full">
                                            <div className=" text-sm sm:text-base font-normal mb-1">{cell.date}</div>
                                            {cell.event && (
                                                <>

                                                    {cell.event.length >= 1 && (
                                                        <Tooltip>
                                                            <Dialog>

                                                                <DialogTrigger asChild>
                                                                    <TooltipTrigger asChild>


                                                                        <div
                                                                            className={`${pillBaseClasses} bg-yellow-100 text-sm sm:text-base text-start text-yellow-800 border-l-4 border-yellow-500`}
                                                                        >
                                                                            {cell.event[0]}
                                                                        </div>


                                                                    </TooltipTrigger>
                                                                </DialogTrigger>
                                                                <EditEventModal></EditEventModal>

                                                            </Dialog>
                                                            <TooltipContent
                                                                className="bg-[#868686] dark:bg-darkPrimaryBg dark:fill-darkPrimaryBg shadow-xl rounded-lg px-5 py-4 max-w-xs"
                                                            >
                                                                <h2 className="text-sm font-semibold text-white dark:text-darkTextPrimary mb-3 border-b dark:border-darkBorder pb-1">
                                                                    Event Participants
                                                                </h2>

                                                                <div className="flex items-center mb-4">
                                                                    {[
                                                                        "https://avatar.iran.liara.run/public/18",
                                                                        "https://avatar.iran.liara.run/public/20",
                                                                        "https://avatar.iran.liara.run/public/22",
                                                                    ].map((imgSrc, index) => (
                                                                        <Image
                                                                            key={index}
                                                                            src={imgSrc}
                                                                            width={40}
                                                                            height={40}
                                                                            alt={`Assignee ${index + 1}`}
                                                                            className="rounded-full w-10 h-10 -ml-3 first:ml-0 border border-white dark:border-darkBorder shadow-sm"
                                                                        />
                                                                    ))}

                                                                    <div className="w-10 h-10 -ml-3 text-headingTextColor rounded-full bg-[#ede7ff] flex items-center justify-center text-sm font-semibold  border border-white shadow-sm">
                                                                        10+
                                                                    </div>
                                                                </div>

                                                                <h3 className="text-sm font-semibold text-white dark:text-darkTextPrimary border-b dark:border-darkBorder pb-1 mb-2">
                                                                    Assigned By
                                                                </h3>

                                                                <div className="flex items-center gap-2">
                                                                    <Image
                                                                        src="https://avatar.iran.liara.run/public/18"
                                                                        width={32}
                                                                        height={32}
                                                                        alt="Assigner"
                                                                        className="rounded-full w-8 h-8 border dark:border-darkBorder"
                                                                    />
                                                                    <p className="text-sm text-white dark:text-darkTextPrimary">
                                                                        Dannielis Vettori
                                                                    </p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}

                                                    {cell.event.length >= 2 && (
                                                        <div className={`${pillBaseClasses} bg-pink-100 text-sm sm:text-base text-start text-pink-800 border-l-4 border-red-500`}>
                                                            {cell.event[1]}
                                                        </div>
                                                    )}

                                                    {cell.event.length >= 3 && (
                                                        <div className={`${pillBaseClasses} bg-pink-100 text-sm sm:text-base text-start text-pink-800 border-l-4 border-red-500`}>
                                                            {cell.event[2]}
                                                        </div>
                                                    )}

                                                    {cell.event.length >= 4 && (
                                                        <div className={`${pillBaseClasses} bg-pink-100 text-sm sm:text-base text-start text-pink-800 border-l-4 border-red-500`}>
                                                            {cell.event[3]}
                                                        </div>
                                                    )}

                                                    {/* {cell.event.length > 2 && (
                                                        <div className={`${pillBaseClasses} bg-green-100 text-sm sm:text-base text-start text-green-800 border-l-4 border-green-500`}>
                                                            + {cell.event.length - 2} others
                                                        </div>
                                                    )} */}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default CalenderTable;