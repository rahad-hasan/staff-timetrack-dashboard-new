"use client";
import { useColorStore } from "@/store/globalColorStore";
import { IMonthlyWorkReport } from "@/types/type";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const valid =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const value = Number.parseInt(valid, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const durationToHours = (value: string) => {
  const [hours = "0", minutes = "0", seconds = "0"] = value.split(":");
  return Number(hours) + Number(minutes) / 60 + Number(seconds) / 3600;
};

const formatHoursAndMinutes = (value: string) => {
  const [hours = "0", minutes = "0"] = value.split(":");
  return `${Number(hours)}h ${String(Number(minutes)).padStart(2, "0")}m`;
};

const round = (value: number) => Number(value.toFixed(2));

const buildCalendarDays = (year: number, month: number) => {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end });
};

const ChartCard = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={`rounded-[24px] border border-borderColor/70 bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg ${className}`}
  >
    <h3 className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
      {title}
    </h3>
    <div className="mt-4">{children}</div>
  </section>
);

const KpiTile = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) => (
  <div className="rounded-[20px] border border-borderColor/70 bg-bgSecondary/60 p-4 dark:border-darkBorder dark:bg-darkPrimaryBg/60">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
      {label}
    </p>
    <p className="mt-3 text-3xl font-semibold text-primary">{value}</p>
    <p className="mt-2 text-sm text-subTextColor dark:text-darkTextSecondary">
      {helper}
    </p>
  </div>
);

const EmptyChartState = ({ message }: { message: string }) => (
  <div className="flex h-[320px] items-center justify-center rounded-[20px] border border-dashed border-borderColor/70 bg-bgSecondary/40 px-6 text-center text-sm text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg/40 dark:text-darkTextSecondary">
    {message}
  </div>
);

const MonthlyReportCharts = ({ data }: { data: IMonthlyWorkReport }) => {
  const { color } = useColorStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const palette = {
    primary: color || "#12cd69",
    primarySoft: hexToRgba(color || "#12cd69", isDark ? 0.42 : 0.22),
    mutedFill: isDark ? "#8F98A8" : "#D4DAE3",
    surfaceStroke: isDark ? "#4a5263" : "#dce3e3",
    text: isDark ? "#F3F4F6" : "#0f1613",
    subText: isDark ? "#bdbdbd" : "#505553",
    warning: "#efaf07",
    danger: "#f40139",
  };

  const workloadMix = [
    {
      name: "Active",
      value: durationToHours(data.summary.total_active_time),
      fill: palette.primary,
    },
    {
      name: "Idle",
      value: durationToHours(data.summary.total_idle_time),
      fill: palette.warning,
    },
    {
      name: "Deleted",
      value: durationToHours(data.summary.total_deleted_time),
      fill: palette.mutedFill,
    },
  ];

  const dailyTrend = data.daily_breakdown.map((day) => ({
    label: format(parseISO(day.date), "dd"),
    worked: round(durationToHours(day.worked_duration)),
    active: round(durationToHours(day.active_time)),
    idle: round(durationToHours(day.idle_time)),
    activity: day.activity,
    anomalies: day.anomaly_count,
    screenshots: day.screenshot_count,
  }));

  const exceptionTrend = data.attendance.map((item) => ({
    label: format(parseISO(item.date), "dd"),
    late: item.late_minutes,
    early: item.early_minutes,
  }));

  const topTasks = data.projects
    .flatMap((project) =>
      project.tasks.map((task) => ({
        name: task.name === "(unassigned)" ? "Unassigned" : task.name,
        hours: round(durationToHours(task.duration)),
        activity: task.activity,
      })),
    )
    .sort((first, second) => second.hours - first.hours)
    .slice(0, 8);

  const weeklyBuckets = data.daily_breakdown
    .reduce<Array<{ label: string; worked: number; active: number }>>(
      (acc, day, index) => {
        const bucketIndex = Math.floor(index / 7);
        const bucket = acc[bucketIndex] ?? {
          label: `Week ${bucketIndex + 1}`,
          worked: 0,
          active: 0,
        };

        bucket.worked += durationToHours(day.worked_duration);
        bucket.active += durationToHours(day.active_time);
        acc[bucketIndex] = bucket;
        return acc;
      },
      [],
    )
    .map((item) => ({
      ...item,
      worked: round(item.worked),
      active: round(item.active),
    }));

  const taskCount = data.projects.reduce(
    (sum, project) => sum + project.tasks.length,
    0,
  );

  const projectBreakdown = data.projects
    .map((project) => ({
      ...project,
      hours: round(durationToHours(project.duration)),
    }))
    .sort((first, second) => second.hours - first.hours);

  const longestProjectHours = Math.max(
    ...projectBreakdown.map((project) => project.hours),
    1,
  );

  const projectDistribution = projectBreakdown.slice(0, 8).map((project) => ({
    name: project.name,
    hours: project.hours,
    activity: project.activity,
  }));

  const leaveHolidayMix = [
    {
      name: "Leave Days",
      value: data.summary.total_leave_days,
      fill: "#f43f5e",
    },
    {
      name: "Holiday Days",
      value: data.summary.total_holidays,
      fill: "#0ea5e9",
    },
    {
      name: "Attended Days",
      value: data.summary.attended_days,
      fill: palette.primary,
    },
  ].filter((item) => item.value > 0);

  const anomalyBySeverity = Object.entries(
    data.anomalies.reduce<Record<string, number>>((acc, item) => {
      const severity = item.anomaly.severity || "unknown";
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({
    name,
    value,
    fill:
      name === "high"
        ? palette.danger
        : name === "medium"
          ? palette.warning
          : palette.primary,
  }));
  const hasAnomalySeverityData = anomalyBySeverity.some(
    (item) => item.value > 0,
  );

  const calendarDays = buildCalendarDays(data.period.year, data.period.month);
  const calendarMap = new Map(
    data.daily_breakdown.map((day) => [day.date, day]),
  );
  const calendarBarData = calendarDays.map((date) => {
    const key = format(date, "yyyy-MM-dd");
    const day = calendarMap.get(key);

    return {
      label: format(date, "dd"),
      fullLabel: format(date, "EEE, MMM d"),
      weekday: format(date, "EEE"),
      hours: day ? round(durationToHours(day.worked_duration)) : 0,
      activity: day?.activity ?? 0,
      anomalies: day?.anomaly_count ?? 0,
      screenshots: day?.screenshot_count ?? 0,
      late: day?.late_minutes ?? 0,
      early: day?.early_minutes ?? 0,
      checkIn: day?.check_in ?? null,
      leaveType: day?.leave_type ?? null,
      holiday: day?.holiday ?? null,
      fill: day?.leave_type
        ? "#f43f5e"
        : day?.holiday
          ? "#0ea5e9"
          : day && (day.late_minutes > 0 || day.early_minutes > 0)
            ? "#efaf07"
            : palette.primary,
    };
  });

  const tooltipStyle = {
    backgroundColor: isDark ? "#323947" : "#ffffff",
    border: `1px solid ${palette.surfaceStroke}`,
    borderRadius: 16,
    color: palette.text,
  };
  const tooltipLabelStyle = {
    color: palette.text,
  };
  const tooltipItemStyle = {
    color: palette.text,
  };

  const axisStyle = { fill: palette.subText, fontSize: 12 };
  const showChart = (_section?: string) => true;

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-borderColor/70 bg-bgPrimary px-5 py-6 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg sm:px-6">
        <div className="text-center lg:text-left">
          <h2 className="text-3xl font-semibold tracking-tight text-headingTextColor dark:text-darkTextPrimary sm:text-4xl">
            Monthly Work Report Metrics
          </h2>
          <p className="mt-3 text-sm text-subTextColor dark:text-darkTextSecondary sm:text-base">
            {data.user.name} • {format(parseISO(data.period.from_date), "dd MMM")} to{" "}
            {format(parseISO(data.period.to_date), "dd MMM yyyy")} • {data.user.time_zone}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
          <KpiTile
            label="Worked Time"
            value={formatHoursAndMinutes(data.summary.total_worked_duration)}
            helper={`${formatHoursAndMinutes(data.summary.total_active_time)} active • ${formatHoursAndMinutes(data.summary.total_idle_time)} idle`}
          />
          <KpiTile
            label="Average Activity"
            value={`${data.summary.avg_activity}%`}
            helper={`${data.summary.avg_mouse_activity}% mouse • ${data.summary.avg_keyboard_activity}% keyboard`}
          />
          <KpiTile
            label="Attendance Rate"
            value={`${Math.round((data.summary.attended_days / Math.max(data.daily_breakdown.length, 1)) * 100)}%`}
            helper={`${data.summary.late_days} late day(s) • ${data.summary.early_days} early day(s)`}
          />
          <KpiTile
            label="Tracker Signals"
            value={`${data.summary.total_screenshots}`}
            helper={`${data.summary.total_anomalies} anomalies • ${data.summary.total_suspensions} suspensions`}
          />
        </div>

        {showChart("workload_mix") ||
        showChart("daily_work_activity") ||
        showChart("attendance_exceptions") ? (
          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1.5fr_1.1fr]">
            {showChart("workload_mix") ? (
              <ChartCard title="Workload Mix">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={workloadMix}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={68}
                          outerRadius={96}
                          stroke="none"
                          paddingAngle={3}
                        >
                          {workloadMix.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          labelStyle={tooltipLabelStyle}
                          itemStyle={tooltipItemStyle}
                          formatter={(value: number) => `${round(value)}h`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    <div className="text-center md:text-left">
                      <p className="text-4xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                        {round(
                          durationToHours(data.summary.total_worked_duration),
                        )}
                      </p>
                      <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                        Total worked hours
                      </p>
                    </div>
                    {workloadMix.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className="size-3 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-headingTextColor dark:text-darkTextPrimary">
                          {item.name}
                        </span>
                        <span className="ml-auto text-subTextColor dark:text-darkTextSecondary">
                          {round(item.value)}h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            ) : null}

            {showChart("daily_work_activity") ? (
              <ChartCard title="Daily Worked vs Activity">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dailyTrend}>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke={palette.surfaceStroke}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                      />
                      <YAxis
                        yAxisId="hours"
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                      />
                      <YAxis
                        yAxisId="activity"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                      />
                      <Legend />
                      <Bar
                        yAxisId="hours"
                        dataKey="worked"
                        name="Worked Hours"
                        fill={palette.mutedFill}
                        radius={[8, 8, 0, 0]}
                      />
                      <Line
                        yAxisId="activity"
                        type="monotone"
                        dataKey="activity"
                        name="Activity %"
                        stroke={palette.primary}
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            ) : null}

            {showChart("attendance_exceptions") ? (
              <ChartCard title="Attendance Exceptions">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={exceptionTrend}>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke={palette.surfaceStroke}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                      />
                      <Legend />
                      <Bar
                        dataKey="late"
                        name="Late Minutes"
                        stackId="a"
                        fill={palette.danger}
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="early"
                        name="Early Minutes"
                        stackId="a"
                        fill={palette.warning}
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            ) : null}
          </div>
        ) : null}

        {showChart("top_task_hours") || showChart("monthly_summary") ? (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_0.9fr]">
            {showChart("top_task_hours") ? (
              <ChartCard title="Top Task Hours">
                <div className="h-[290px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topTasks}
                      layout="vertical"
                      margin={{ left: 16, right: 12 }}
                    >
                      <CartesianGrid
                        horizontal={false}
                        strokeDasharray="3 3"
                        stroke={palette.surfaceStroke}
                      />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={160}
                        tick={axisStyle}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                      />
                      <Legend />
                      <Bar
                        dataKey="hours"
                        name="Hours"
                        fill={palette.primary}
                        radius={[0, 10, 10, 0]}
                      />
                      <Bar
                        dataKey="activity"
                        name="Activity %"
                        fill={palette.primarySoft}
                        radius={[0, 10, 10, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            ) : null}

            {showChart("monthly_summary") ? (
              <div className="grid gap-4">
                <KpiTile
                  label="Task Count"
                  value={`${taskCount}`}
                  helper={`${data.summary.total_projects} projects • ${data.summary.total_tasks} reported tasks`}
                />
                <KpiTile
                  label="Late / Early"
                  value={`${data.summary.late_days}/${data.summary.early_days}`}
                  helper={`${data.summary.total_late_hm} late • ${data.summary.total_early_hm} early`}
                />
                <KpiTile
                  label="Earnings"
                  value={`${data.user.currency || "USD"} ${data.summary.earnings}`}
                  helper={`${data.summary.total_leave_days} leave days • ${data.summary.total_holidays} holidays`}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {showChart("weekly_output_trend") || showChart("monthly_summary") ? (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            {showChart("weekly_output_trend") ? (
              <ChartCard title="Weekly Output Trend">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyBuckets}>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke={palette.surfaceStroke}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="worked"
                        name="Worked"
                        stroke={palette.primary}
                        fill={palette.primarySoft}
                        fillOpacity={1}
                        strokeWidth={2.5}
                      />
                      <Area
                        type="monotone"
                        dataKey="active"
                        name="Active"
                        stroke={palette.warning}
                        fill={hexToRgba(palette.warning, isDark ? 0.25 : 0.15)}
                        fillOpacity={1}
                        strokeWidth={2.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            ) : null}

            {showChart("monthly_summary") ? (
              <ChartCard title="Tracker Summary">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <KpiTile
                    label="Total Notes"
                    value={`${data.summary.total_notes}`}
                    helper="Notes captured during the month"
                  />
                  <KpiTile
                    label="Suspensions"
                    value={`${data.summary.total_suspensions}`}
                    helper={`Duration ${formatHoursAndMinutes(data.summary.total_suspension_duration)}`}
                  />
                  <div className="sm:col-span-2">
                    <KpiTile
                      label="Captures"
                      value={`${data.summary.total_screenshots}`}
                      helper={`${data.summary.total_anomalies} anomalies across the month`}
                    />
                  </div>
                </div>
              </ChartCard>
            ) : null}
          </div>
        ) : null}

        <>
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
              <ChartCard title="Daily Breakdown Trend">
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dailyTrend}>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke={palette.surfaceStroke}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                      />
                      <YAxis
                        yAxisId="hours"
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                      />
                      <YAxis
                        yAxisId="activity"
                        orientation="right"
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                      />
                      <Legend />
                      <Bar
                        yAxisId="hours"
                        dataKey="active"
                        name="Active Hours"
                        fill={palette.primary}
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        yAxisId="hours"
                        dataKey="idle"
                        name="Idle Hours"
                        fill={palette.warning}
                        radius={[8, 8, 0, 0]}
                      />
                      <Line
                        yAxisId="activity"
                        type="monotone"
                        dataKey="activity"
                        name="Activity %"
                        stroke={palette.danger}
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Anomaly Severity Mix">
                {hasAnomalySeverityData ? (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={anomalyBySeverity}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={104}
                          stroke="none"
                          paddingAngle={4}
                        >
                          {anomalyBySeverity.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          labelStyle={tooltipLabelStyle}
                          itemStyle={tooltipItemStyle}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChartState message="No anomaly severity data is available for this month." />
                )}
              </ChartCard>
            </div>

            <ChartCard title="Month Calendar Heatmap" className="mt-4">
              <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-subTextColor dark:text-darkTextSecondary sm:grid-cols-4">
                <div className="rounded-2xl border border-borderColor/70 bg-bgSecondary/50 px-3 py-2 dark:border-darkBorder dark:bg-darkPrimaryBg/50">
                  <span className="inline-block size-2 rounded-full bg-primary" />
                  <span className="ml-2">Normal workday</span>
                </div>
                <div className="rounded-2xl border border-borderColor/70 bg-bgSecondary/50 px-3 py-2 dark:border-darkBorder dark:bg-darkPrimaryBg/50">
                  <span className="inline-block size-2 rounded-full bg-rose-500" />
                  <span className="ml-2">Leave</span>
                </div>
                <div className="rounded-2xl border border-borderColor/70 bg-bgSecondary/50 px-3 py-2 dark:border-darkBorder dark:bg-darkPrimaryBg/50">
                  <span className="inline-block size-2 rounded-full bg-sky-500" />
                  <span className="ml-2">Holiday</span>
                </div>
                <div className="rounded-2xl border border-borderColor/70 bg-bgSecondary/50 px-3 py-2 dark:border-darkBorder dark:bg-darkPrimaryBg/50">
                  <span className="inline-block size-2 rounded-full bg-amber-500" />
                  <span className="ml-2">Late / Early</span>
                </div>
              </div>

              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calendarBarData}>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke={palette.surfaceStroke}
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={axisStyle}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={axisStyle} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={tooltipLabelStyle}
                      itemStyle={tooltipItemStyle}
                      formatter={(value: number) => [`${value}h`, "Worked"]}
                      labelFormatter={(_, payload) => {
                        const item = payload?.[0]?.payload;
                        if (!item) return "";

                        const details = [
                          `${item.fullLabel}`,
                          `${item.activity}% activity`,
                          item.checkIn ? `Check-in ${item.checkIn}` : "",
                          item.late > 0 ? `Late ${item.late}m` : "",
                          item.early > 0 ? `Early ${item.early}m` : "",
                          item.leaveType || "",
                          item.holiday || "",
                          item.anomalies > 0
                            ? `${item.anomalies} anomalies`
                            : "",
                          item.screenshots > 0
                            ? `${item.screenshots} screenshots`
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" • ");

                        return details;
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="hours"
                      name="Worked Hours"
                      radius={[8, 8, 0, 0]}
                    >
                      {calendarBarData.map((entry) => (
                        <Cell key={entry.label} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <div className="mt-4 grid grid-cols-1 gap-4 2xl:grid-cols-[1.35fr_0.9fr]">
              <ChartCard title="Anomaly and Screenshot Trend">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyTrend}>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke={palette.surfaceStroke}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={axisStyle}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                      />
                      <Legend />
                      <Bar
                        dataKey="screenshots"
                        name="Screenshots"
                        fill={palette.primarySoft}
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="anomalies"
                        name="Anomalies"
                        fill={palette.danger}
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Leave, Holiday, Attendance Mix">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leaveHolidayMix}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={56}
                        outerRadius={92}
                        stroke="none"
                        paddingAngle={4}
                      >
                        {leaveHolidayMix.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
        </>
      </div>
    </div>
  );
};

export default MonthlyReportCharts;
