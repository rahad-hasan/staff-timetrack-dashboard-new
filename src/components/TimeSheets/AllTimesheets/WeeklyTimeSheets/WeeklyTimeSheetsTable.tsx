/* eslint-disable @typescript-eslint/no-explicit-any */
import { format, parseISO } from "date-fns";

const WeeklyTimeSheetsTable = ({ data }: { data: any[] }) => {

    const firstProject = data?.[0];
    const dateKeys = firstProject ? Object.keys(firstProject.per_day).sort() : [];

    // 2. Calculate Footer Totals (Vertical sum for each day)
    const dailyTotals = dateKeys.map((dateKey) => {
        let totalSeconds = 0;
        data?.forEach((item) => {
            const timeStr = item?.per_day[dateKey]?.formatted || "00:00:00";
            const [hrs, mins, secs] = timeStr?.split(":")?.map(Number);
            totalSeconds += hrs * 3600 + mins * 60 + secs;
        });

        // Convert back to HH:mm:ss
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    });

    // 3. Calculate All-Week Total (Sum of all project totals)
    const grandTotalSeconds = data?.reduce((acc, item) => {
        const [hrs, mins, secs] = item?.total_duration_formatted.split(":").map(Number);
        return acc + (hrs * 3600 + mins * 60 + secs);
    }, 0);

    const grandTotalFormatted = `${String(Math.floor(grandTotalSeconds / 3600)).padStart(2, "0")}:${String(
        Math.floor((grandTotalSeconds % 3600) / 60)
    ).padStart(2, "0")}:${String(grandTotalSeconds % 60).padStart(2, "0")}`;

    if (!data || data.length === 0) {
        return <div className="p-40 text-center border rounded-2xl">No data available for this week.</div>;
    }

    return (
        <div>
            <div className="overflow-x-auto rounded-2xl border border-borderColor dark:border-darkBorder ">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="text-slate-900 border-b dark:border-darkBorder">
                            <th className="px-4 py-5 text-left font-medium text-headingTextColor dark:text-darkTextPrimary min-w-[200px]">
                                Project name
                            </th>
                            {dateKeys.map((dateStr) => {
                                const dateObj = parseISO(dateStr);
                                return (
                                    <th key={dateStr} className="px-4 py-5 text-center border-x dark:border-darkBorder text-headingTextColor dark:text-darkTextPrimary">
                                        <h2 className="text-2xl font-bold">{format(dateObj, "dd")}</h2>
                                        <div className="mt-0.5 text-base font-medium text-subTextColor dark:text-darkTextSecondary">
                                            {format(dateObj, "EEEE")}
                                        </div>
                                    </th>
                                );
                            })}
                            <th className="px-4 py-5 text-center font-medium text-headingTextColor dark:text-darkTextPrimary">
                                Week Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.map((item: any, index: number) => (
                            <tr key={index} className="text-slate-900 border-b dark:border-darkBorder last:border-none">
                                <td className="px-4 py-5 text-left">
                                    <h2 className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                        {item?.project?.name}
                                    </h2>
                                    <p className="text-sm font-normal text-subTextColor dark:text-darkTextSecondary">
                                        {item?.task?.name || "No Task"}
                                    </p>
                                </td>
                                {dateKeys?.map((dateKey) => (
                                    <td key={dateKey} className="px-4 py-5 text-center border-x dark:border-darkBorder">
                                        <h2 className={`text-lg ${item?.per_day[dateKey]?.formatted === "00:00:00" ? "text-gray-300 dark:text-gray-600" : "text-headingTextColor dark:text-darkTextPrimary"}`}>
                                            {item?.per_day[dateKey]?.formatted === "00:00:00" ? "-" : item?.per_day[dateKey]?.formatted}
                                        </h2>
                                    </td>
                                ))}
                                <td className="px-4 py-5 text-center">
                                    <h2 className="text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
                                        {item?.total_duration_formatted}
                                    </h2>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50/50 dark:bg-darkSecondaryBg/20">
                        <tr className="text-headingTextColor">
                            <td className="px-4 py-5 text-left font-bold dark:text-darkTextPrimary">
                                Total
                            </td>
                            {dailyTotals?.map((total, i) => (
                                <td key={i} className="px-4 py-5 text-center border-x dark:border-darkBorder font-bold dark:text-darkTextPrimary">
                                    {total === "00:00:00" ? "" : total}
                                </td>
                            ))}
                            <td className="px-4 py-5 text-center">
                                <h2 className="text-lg font-bold text-primary">{grandTotalFormatted}</h2>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default WeeklyTimeSheetsTable;