/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format } from "date-fns";

const ReportWeeklyTimeSheet = ({ dateBasedTimeEntry }: any) => {
  type Row = {
    times: Array<{ [key: string]: string }>;
    weekTotal: string;
  };


  const rows: Row = {
    // times: [{ time: "8h 0m" }, { time: "8h 0m" }, { time: "-" }, { time: "-" }, { time: "8h 0m" }, { time: "8h 0m" }, { time: "-" }],
    times: dateBasedTimeEntry?.data?.daily_data,
    weekTotal: dateBasedTimeEntry?.data?.total_time,
  };

  return (
    <div>
      <div className="overflow-x-auto w-full ">
        {/* <table className="w-full border-collapse">
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
        </table> */}

        <div className="mb-2.5">
          <h1 className="text-headingTextColor dark:text-darkTextPrimary text-md md:text-xl">
            Total Hour:{" "}
            <span className="font-bold text-primary">{rows?.weekTotal}</span>
          </h1>
        </div>

        <div className=" grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] md:grid-cols-7 gap-2">
          {rows?.times?.map((time) => (
            <div
              key={time.date}
              className=" border rounded-lg dark:border-darkBorder p-4 flex flex-col justify-center items-center gap-1.5"
            >
              <h2 className="font-bold text-headingTextColor/70 dark:text-darkTextPrimary/60">
                {format(new Date(time.date), "EEE").toUpperCase()}
              </h2>
              <p className=" text-textGray dark:text-darkTextSecondary">
                {format(time.date, "dd")}
              </p>
              <h2
                className={`${time.duration === "00:00:00" ? "text-textGray dark:text-darkTextSecondary" : "text-primary"} font-bold`}
              >
                {time.duration}
              </h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportWeeklyTimeSheet;
