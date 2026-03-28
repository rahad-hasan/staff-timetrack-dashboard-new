/* eslint-disable @typescript-eslint/no-explicit-any */
import { format, parseISO } from "date-fns";
import Image from "next/image";
import EmptyTableLogo from "@/assets/empty_table.svg";

type WeeklyTimeSheetsTableProps = {
  items: any[];
  dayKeys: string[];
  totals: {
    duration_formatted: string;
    per_day: Record<string, { formatted: string }>;
  };
};

const WeeklyTimeSheetsTable = ({
  items,
  dayKeys,
  totals,
}: WeeklyTimeSheetsTableProps) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-between gap-4">
        <Image
          src={EmptyTableLogo}
          alt="table empty"
          width={120}
          height={120}
        />
        <p className="text-lg">No data available for this week.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-borderColor dark:border-darkBorder">
      <table className="w-full border-collapse">
        {/* ================= HEADER ================= */}
        <thead>
          <tr className="border-b dark:border-darkBorder">
            <th className="px-4 py-5 text-left min-w-[200px]">Project name</th>

            {dayKeys.map((dateStr) => {
              const dateObj = parseISO(dateStr);
              return (
                <th
                  key={dateStr}
                  className="px-4 py-5 text-center border-x dark:border-darkBorder"
                >
                  <div className="text-2xl font-bold">
                    {format(dateObj, "dd")}
                  </div>
                  <div className="text-sm">{format(dateObj, "EEEE")}</div>
                </th>
              );
            })}

            <th className="px-4 py-5 text-center">Week Total</th>
          </tr>
        </thead>

        {/* ================= BODY ================= */}
        <tbody>
          {items.map((item, idx) => (
            <tr
              key={idx}
              className="border-b dark:border-darkBorder last:border-none"
            >
              <td className="px-4 py-5 text-left">
                <div className="font-medium">{item.project.name}</div>
                <div className="text-sm text-subTextColor dark:text-darkTextSecondary">
                  {item.task.name ?? "No Task"}
                </div>
              </td>

              {dayKeys.map((day) => {
                const value = item.per_day[day]?.formatted ?? "00:00:00";
                return (
                  <td
                    key={day}
                    className="px-4 py-5 text-center border-x dark:border-darkBorder"
                  >
                    {value === "00:00:00" ? "-" : value}
                  </td>
                );
              })}

              <td className="px-4 py-5 text-center font-medium">
                {item.total_duration_formatted}
              </td>
            </tr>
          ))}
        </tbody>

        {/* ================= FOOTER ================= */}
        <tfoot className="bg-gray-50/50 dark:bg-darkSecondaryBg/20">
          <tr className="font-bold">
            <td className="px-4 py-5 text-left">Total</td>

            {dayKeys.map((day) => {
              const value = totals.per_day[day]?.formatted ?? "00:00:00";
              return (
                <td
                  key={day}
                  className="px-4 py-5 text-center border-x dark:border-darkBorder"
                >
                  {value === "00:00:00" ? "" : value}
                </td>
              );
            })}

            <td className="px-4 py-5 text-center text-primary">
              {totals.duration_formatted}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default WeeklyTimeSheetsTable;
