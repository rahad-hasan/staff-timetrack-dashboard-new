
const WeeklyTimeSheetsTable = () => {
    type DayMeta = { key: string; date: string; name: string };
    type Row = {
        project: string;
        task?: string;
        times: Array<{ [key: string]: string }>;
        weekTotal: string;
    };
    type TableFooter = {
        project: string;
        times: Array<{ [key: string]: string }>;
        allWeekTotal: string;
    };

    const days: DayMeta[] = [
        { key: "mon", date: "18", name: "Monday" },
        { key: "tue", date: "19", name: "Tuesday" },
        { key: "wed", date: "20", name: "Wednesday" },
        { key: "thu", date: "21", name: "Thursday" },
        { key: "fri", date: "22", name: "Friday" },
        { key: "sat", date: "23", name: "Saturday" },
        { key: "sun", date: "24", name: "Sunday" },
    ];

    const rows: Row[] = [
        {
            project: "Orbit Technology’s project",
            task: "No Task",
            times: [{ time: "2:00:00" }, { time: "4:23:00" }, { time: "-" }, { time: "-" }, { time: "-" }, { time: "2:31:05" }, { time: "-" }],
            weekTotal: "7:00:00"
        },
        {
            project: "Orbit Technology’s project",
            task: "Work on management",
            times: [{ time: "1:00:00" }, { time: "-" }, { time: "-" }, { time: "4:00:00" }, { time: "-" }, { time: "2:31:05" }, { time: "3:00:00" }],
            weekTotal: "9:00:00"
        },
        {
            project: "Orbit Technology’s project",
            task: "Marketing design",
            times: [{ time: "-" }, { time: "3:33:00" }, { time: "-" }, { time: "-" }, { time: "-" }, { time: "2:31:05" }, { time: "-" }],
            weekTotal: "5:00:00"
        },
    ];

    const tableFooter: TableFooter = {
        project: " All Project Total",
        times: [{ time: "3:00:00" }, { time: "7:56:00" }, { time: "-" }, { time: "4:00:00" }, { time: "-" }, { time: "7:33:00" }, { time: "3:00:00" }],
        allWeekTotal: "21:00:00",
    }

    return (
        <div>
            <div className="overflow-x-auto rounded-2xl border border-borderColor dark:border-darkBorder ">
                <table className="w-full">
                    <thead className=" ">
                        <tr className="text-slate-900 border dark:border-darkBorder">
                            <th className=" z-10 px-4 py-5 text-left border dark:border-darkBorder dark:text-darkTextPrimary">
                                Project name
                            </th>
                            {days.map((d) => (
                                <th key={d.key} className=" z-10 px-4 py-5 text-center border dark:border-darkBorder dark:text-darkTextPrimary">
                                    <h2 className=" text-2xl font-bold">{d.date}</h2>
                                    <div className="mt-0.5 text-xs text-gray-500 dark:text-darkTextSecondary">{d.name}</div>
                                </th>
                            ))}
                            <th className=" z-10 px-4 py-5 text-center border dark:border-darkBorder dark:text-darkTextPrimary">
                                Week Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="border ">
                        {rows.map((project: Row, i: number) => (
                            <tr key={i} className="text-slate-900 border dark:border-darkBorder">
                                <td className=" z-10 px-4 py-5 text-left border dark:border-darkBorder">
                                    <h2 className=" font-semibold dark:text-darkTextPrimary">{project?.project}</h2>
                                    <p className=" text-sm dark:text-darkTextSecondary">{project?.task}</p>
                                </td>
                                {project?.times?.map((time, i) => (
                                    <td key={i} className=" z-10 px-4 py-5 text-center border dark:border-darkBorder">
                                        <h2 className=" text-lg dark:text-darkTextPrimary">{time.time}</h2>
                                    </td>
                                ))}
                                <td className=" z-10 px-4 py-5 text-center border dark:border-darkBorder">
                                    <h2 className="text-lg dark:text-darkTextPrimary">{project?.weekTotal}</h2>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="border dark:border-darkBorder">
                        <tr className="text-slate-900 border dark:border-darkBorder">
                            <td className=" z-10 px-4 py-5 text-left border dark:border-darkBorder">
                                <h2 className=" font-semibold dark:text-darkTextPrimary">{tableFooter?.project}</h2>
                            </td>
                            {tableFooter?.times?.map((time, i) => (
                                <td key={i} className=" z-10 px-4 py-5 text-center border dark:border-darkBorder">
                                    <h2 className=" text-lg dark:text-darkTextPrimary">{time.time}</h2>
                                </td>
                            ))}
                            <td className=" z-10 px-4 py-5 text-center border dark:border-darkBorder">
                                <h2 className="text-lg text-[#5db0f1] ">{tableFooter?.allWeekTotal}</h2>
                            </td>
                        </tr>

                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default WeeklyTimeSheetsTable;