"use client";

import Image from "next/image";
import { BarChart3 } from "lucide-react"; // or use any standard SVG icon
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export interface IActivityStats {
  [key: string]: any;
}

export interface ICurrentTask {
  id: number | string;
  title: string;
  [key: string]: any;
}

export type WeeklyChartData = Record<
  "0" | "1" | "2" | "3" | "4" | "5" | "6",
  number
>;

export interface IDuration {
  hours: number;
  formatted: string;
}

export interface UserActivityData {
  user_id: number;
  name: string;
  email: string;
  image: string;
  work_duration: IDuration;
  idle_duration: IDuration;
  active_duration: IDuration;
  activity: number;
  projects_count: number;
  tasks_count: number;
  rank: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as UserActivityData;
    const { name, email, image, activity, projects_count, tasks_count } = data;

    return (
      <div className="bg-white/95 dark:bg-darkPrimaryBg backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xl min-w-55 transition-all">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-600">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800">
            {image ? (
              <Image
                src={image}
                alt={name}
                fill
                sizes="40px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-slate-500">
                {name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
              {name}
            </h4>
            <p className="text-xs text-subTextColor dark:text-slate-400">
              {email}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Activity Rate
            </span>
            <span className="font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-200/50 dark:border-sky-800/50">
              {activity}%
            </span>
          </div>

          {(projects_count !== undefined || tasks_count !== undefined) && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-slate-50 dark:bg-darkSecondaryBg p-1.5 rounded-lg text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Projects
                </p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {projects_count ?? 0}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-darkSecondaryBg p-1.5 rounded-lg text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Tasks
                </p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {tasks_count ?? 0}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CoreMembersChart = ({ data }: { data?: UserActivityData[] }) => {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="w-full border border-borderColor/60 dark:border-darkBorder/50 dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px] h-full">
      <div>
        <div className="flex items-center gap-1.5 sm:gap-3 sm:w-1/2 mb-2">
          <h2 className="text-base sm:text-lg uppercase text-headingTextColor dark:text-darkTextPrimary">
            Core work members
          </h2>
        </div>

        <div className="w-full h-[280px]">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 10,
                  right: 10,
                  left: 10,
                  bottom: 5,
                }}
              >
                <XAxis tickLine={false} axisLine={false} dataKey="name" hide />
                <YAxis tickLine={false} axisLine={false} hide />
                <Tooltip content={<CustomTooltip />} />

                <Bar
                  barSize={30}
                  dataKey="activity"
                  fill={"#5db0f1"}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            /* Empty State Container */
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 rounded-lg bg-slate-50/50 dark:bg-darkSecondaryBg/30 border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-2.5 text-slate-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                No activity data available
              </p>
              <p className="text-xs text-subTextColor dark:text-slate-400 mt-1 max-w-[220px]">
                Member activity stats will appear here once tracked.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoreMembersChart;