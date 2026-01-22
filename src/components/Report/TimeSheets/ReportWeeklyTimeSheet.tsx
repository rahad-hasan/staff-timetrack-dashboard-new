/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import WeeklyDatePicker from "@/components/Common/WeeklyDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";


const ReportWeeklyTimeSheet = ({ dateBasedTimeEntry }: any) => {

    // table data
    type DayMeta = { name: string };
    type Row = {
        times: Array<{ [key: string]: string }>;
        weekTotal: string;
    };

    const days: DayMeta[] = [
        { name: "Monday" },
        { name: "Tuesday" },
        { name: "Wednesday" },
        { name: "Thursday" },
        { name: "Friday" },
        { name: "Saturday" },
        { name: "Sunday" },
    ];
    const rows: Row =
    {
        // times: [{ time: "8h 0m" }, { time: "8h 0m" }, { time: "-" }, { time: "-" }, { time: "8h 0m" }, { time: "8h 0m" }, { time: "-" }],
        times: dateBasedTimeEntry?.data?.daily_data,
        weekTotal:  dateBasedTimeEntry?.data?.total_time
    }

    return (
        <div>
            <div className="mb-5 flex flex-col gap-4 lg:gap-0 lg:flex-row justify-between">
                <div className=" flex gap-3">
                    <WeeklyDatePicker />
                    {/* <Button className=" hidden sm:flex text-headingTextColor dark:text-darkTextPrimary" variant={'filter'}>
                        <SlidersHorizontal className="text-headingTextColor dark:text-darkTextPrimary" /> Filters
                    </Button> */}
                </div>
                <SelectUserDropDown></SelectUserDropDown>
            </div>
            <div className="overflow-x-auto w-full border rounded-lg dark:border-darkBorder">
                <table className="w-full border-collapse">
                    <thead className="">
                        <tr className="text-headingTextColor">
                            {days.map((d, i) => (
                                <th
                                    key={i}
                                    className={`z-10 px-4 py-5 text-center border-b border-gray-200 dark:border-darkBorder ${i < days.length - 1 ? 'border-r' : ''}`}
                                >
                                    <div className="text-xl font-bold text-headingTextColor dark:text-darkTextPrimary">{d.name}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="">
                        <tr className="text-headingTextColor">
                            {rows?.times?.map((time, i) => (
                                <td
                                    key={i}
                                    className={`z-10 px-4 py-5 text-center ${i < rows.times.length - 1 ? 'border-r border-gray-200 dark:border-darkBorder' : ''}`}
                                >
                                    <h2 className="text-lg text-primary font-medium">
                                        {time.duration.split(':').slice(0, 2).map((v, i) => parseInt(v) + (i === 0 ? 'h' : 'm')).join(' ')}
                                    </h2>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

        </div >
    );
};

export default ReportWeeklyTimeSheet;