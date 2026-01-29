/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
  const rows: Row = {
    // times: [{ time: "8h 0m" }, { time: "8h 0m" }, { time: "-" }, { time: "-" }, { time: "8h 0m" }, { time: "8h 0m" }, { time: "-" }],
    times: dateBasedTimeEntry?.data?.daily_data,
    weekTotal: dateBasedTimeEntry?.data?.total_time,
  };

  return (
    <div>

      <div className="overflow-x-auto w-full border rounded-lg dark:border-darkBorder">
        <table className="w-full border-collapse">
          <thead className="">
            <tr className="text-headingTextColor">
              {days.map((d, i) => (
                <th
                  key={i}
                  className={`z-10 px-4 py-5 text-center border-b border-gray-200 dark:border-darkBorder ${i < days.length - 1 ? "border-r" : ""}`}
                >
                  <div className=" text-base lg:text-xl font-bold text-headingTextColor dark:text-darkTextPrimary">
                    {d.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="">
            <tr className="text-headingTextColor">
              {rows?.times?.map((time, i) => (
                <td
                  key={i}
                  className={`z-10 px-4 py-5 text-center ${i < rows.times.length - 1 ? "border-r border-gray-200 dark:border-darkBorder" : ""}`}
                >
                  <h2 className="text-base lg:text-lg text-primary font-medium">
                    {time.duration
                      .split(":")
                      .slice(0, 2)
                      .map((v, i) => parseInt(v) + (i === 0 ? "h" : "m"))
                      .join(" ")}
                  </h2>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportWeeklyTimeSheet;
