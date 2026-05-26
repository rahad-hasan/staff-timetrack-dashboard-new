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
import { memo, useCallback, useMemo, type ReactNode } from "react";
import type { Payload as TooltipPayload } from "recharts/types/component/DefaultTooltipContent";
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

const DEFAULT_PRIMARY_COLOR = "#12cd69";
const GRID_DASH_ARRAY = "3 3";
const PIE_INNER_RADIUS = 56;
const PIE_OUTER_RADIUS = 92;
const PIE_PADDING_ANGLE = 4;
const STACK_BAR_RADIUS: [number, number, number, number] = [8, 8, 0, 0];
const HORIZONTAL_BAR_RADIUS: [number, number, number, number] = [0, 10, 10, 0];
const ACTIVITY_DOMAIN: [number, number] = [0, 100];
const TASK_BAR_MARGIN = { left: 16, right: 12 };
const TOP_TASK_LIMIT = 8;

type Palette = {
  primary: string;
  primarySoft: string;
  screenshot: string;
  mutedFill: string;
  surfaceStroke: string;
  text: string;
  subText: string;
  warning: string;
  warningSoft: string;
  danger: string;
};

type WorkloadMixItem = {
  name: string;
  value: number;
  displayValue: string;
  fill: string;
};

type DailyTrendItem = {
  label: string;
  worked: number;
  active: number;
  idle: number;
  activity: number;
  anomalies: number;
  screenshots: number;
};

type ExceptionTrendItem = {
  label: string;
  late: number;
  early: number;
};

type TopTaskItem = {
  name: string;
  hours: number;
  activity: number;
};

type WeeklyBucketItem = {
  label: string;
  worked: number;
  active: number;
};

type MixItem = {
  name: string;
  value: number;
  fill: string;
};

type CalendarBarItem = {
  label: string;
  fullLabel: string;
  weekday: string;
  hours: number;
  activity: number;
  anomalies: number;
  screenshots: number;
  late: number;
  early: number;
  checkIn: string | null;
  leaveType: string | null;
  holiday: string | null;
  fill: string;
};

type PerformanceChartsProps = {
  data: IMonthlyWorkReport;
};

type CalendarTooltipPayload = TooltipPayload<string | number, string>;

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

const parseDuration = (value: string) => {
  const [hours = "0", minutes = "0", seconds = "0"] = value.split(":");
  const parsedHours = Number(hours) || 0;
  const parsedMinutes = Number(minutes) || 0;
  const parsedSeconds = Number(seconds) || 0;

  return {
    hours: parsedHours,
    minutes: parsedMinutes,
    seconds: parsedSeconds,
  };
};

const durationToHours = (value: string) => {
  const parsed = parseDuration(value);
  return (
    parsed.hours + parsed.minutes / 60 + parsed.seconds / 3600
  );
};

const formatHoursAndMinutes = (value: string) => {
  const { hours, minutes, seconds } = parseDuration(value);
  const totalMinutes = Math.round(
    hours * 60 + minutes + seconds / 60,
  );
  const formattedHours = Math.floor(totalMinutes / 60);
  const formattedMinutes = totalMinutes % 60;

  return `${formattedHours}h ${formattedMinutes}m`;
};

const round = (value: number) => Number(value.toFixed(2));

const buildCalendarDays = (year: number, month: number) => {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end });
};

const buildWorkloadMix = (
  summary: IMonthlyWorkReport["summary"],
  palette: Palette,
): WorkloadMixItem[] => [
  {
    name: "Active",
    value: durationToHours(summary.total_active_time),
    displayValue: formatHoursAndMinutes(summary.total_active_time),
    fill: palette.primary,
  },
  {
    name: "Idle",
    value: durationToHours(summary.total_idle_time),
    displayValue: formatHoursAndMinutes(summary.total_idle_time),
    fill: palette.warning,
  },
  {
    name: "Deleted",
    value: durationToHours(summary.total_deleted_time),
    displayValue: formatHoursAndMinutes(summary.total_deleted_time),
    fill: palette.mutedFill,
  },
];

const buildDailyTrendAndWeeklyBuckets = (
  dailyBreakdown: IMonthlyWorkReport["daily_breakdown"],
) => {
  const dailyTrend: DailyTrendItem[] = [];
  const weeklyBuckets: WeeklyBucketItem[] = [];

  dailyBreakdown.forEach((day, index) => {
    const worked = durationToHours(day.worked_duration);
    const active = durationToHours(day.active_time);
    const idle = durationToHours(day.idle_time);
    const bucketIndex = Math.floor(index / 7);
    const bucket = weeklyBuckets[bucketIndex] ?? {
      label: `Week ${bucketIndex + 1}`,
      worked: 0,
      active: 0,
    };

    dailyTrend.push({
      label: format(parseISO(day.date), "dd"),
      worked: round(worked),
      active: round(active),
      idle: round(idle),
      activity: day.activity,
      anomalies: day.anomaly_count,
      screenshots: day.screenshot_count,
    });

    bucket.worked += worked;
    bucket.active += active;
    weeklyBuckets[bucketIndex] = bucket;
  });

  return {
    dailyTrend,
    weeklyBuckets: weeklyBuckets.map((item) => ({
      ...item,
      worked: round(item.worked),
      active: round(item.active),
    })),
  };
};

const buildExceptionTrend = (
  attendance: IMonthlyWorkReport["attendance"],
): ExceptionTrendItem[] =>
  attendance.map((item) => ({
    label: format(parseISO(item.date), "dd"),
    late: item.late_minutes,
    early: item.early_minutes,
  }));

const insertTopTask = (topTasks: TopTaskItem[], task: TopTaskItem) => {
  topTasks.push(task);
  topTasks.sort((first, second) => second.hours - first.hours);

  if (topTasks.length > TOP_TASK_LIMIT) {
    topTasks.pop();
  }
};

const buildTopTasksAndCount = (projects: IMonthlyWorkReport["projects"]) => {
  const topTasks: TopTaskItem[] = [];
  let taskCount = 0;

  projects.forEach((project) => {
    taskCount += project.tasks.length;

    project.tasks.forEach((task) => {
      insertTopTask(topTasks, {
        name: task.name === "(unassigned)" ? "Unassigned" : task.name,
        hours: round(durationToHours(task.duration)),
        activity: task.activity,
      });
    });
  });

  return { topTasks, taskCount };
};

const buildLeaveHolidayMix = (
  summary: IMonthlyWorkReport["summary"],
  primaryFill: string,
): MixItem[] =>
  [
    {
      name: "Leave Days",
      value: summary.total_leave_days,
      fill: "#f43f5e",
    },
    {
      name: "Holiday Days",
      value: summary.total_holidays,
      fill: "#0ea5e9",
    },
    {
      name: "Attended Days",
      value: summary.attended_days,
      fill: primaryFill,
    },
  ].filter((item) => item.value > 0);

const buildAnomalyBySeverity = (
  anomalies: IMonthlyWorkReport["anomalies"],
  palette: Palette,
): MixItem[] => {
  const severityCount: Record<string, number> = {};

  anomalies.forEach((item) => {
    const severity = item.anomaly.severity || "unknown";
    severityCount[severity] = (severityCount[severity] || 0) + 1;
  });

  return Object.entries(severityCount).map(([name, value]) => ({
    name,
    value,
    fill:
      name === "high"
        ? palette.danger
        : name === "medium"
          ? palette.warning
          : palette.primary,
  }));
};

const getCalendarDayFill = (
  day: IMonthlyWorkReport["daily_breakdown"][number] | undefined,
  primaryFill: string,
) => {
  if (day?.leave_type) {
    return "#f43f5e";
  }

  if (day?.holiday) {
    return "#0ea5e9";
  }

  if (day && (day.late_minutes > 0 || day.early_minutes > 0)) {
    return "#efaf07";
  }

  return primaryFill;
};

const buildCalendarBarData = (
  dailyBreakdown: IMonthlyWorkReport["daily_breakdown"],
  period: IMonthlyWorkReport["period"],
  primaryFill: string,
): CalendarBarItem[] => {
  const calendarMap = new Map(dailyBreakdown.map((day) => [day.date, day]));

  return buildCalendarDays(period.year, period.month).map((date) => {
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
      fill: getCalendarDayFill(day, primaryFill),
    };
  });
};

const ChartCard = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={`rounded-[12px] border border-borderColor/70 bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg ${className}`}
  >
    <h3 className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
      {title}
    </h3>
    <div className="mt-4">{children}</div>
  </section>
);

const KpiTile = memo(({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) => (
  <div className="rounded-[12px] border border-borderColor/70 bg-bgSecondary/60 p-4 dark:border-darkBorder dark:bg-darkPrimaryBg/60">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
      {label}
    </p>
    <p className="mt-3 text-3xl font-semibold text-primary">{value}</p>
    <p className="mt-2 text-sm text-subTextColor dark:text-darkTextSecondary">
      {helper}
    </p>
  </div>
));
KpiTile.displayName = "KpiTile";

const EmptyChartState = memo(({ message }: { message: string }) => (
  <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-borderColor/70 bg-bgSecondary/40 px-6 text-center text-sm text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg/40 dark:text-darkTextSecondary">
    {message}
  </div>
));
EmptyChartState.displayName = "EmptyChartState";

const PerformanceCharts = ({ data }: PerformanceChartsProps) => {
  const color = useColorStore((state) => state.color);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const palette = useMemo<Palette>(() => {
    const primary = color || DEFAULT_PRIMARY_COLOR;

    return {
      primary,
      primarySoft: hexToRgba(primary, isDark ? 0.42 : 0.22),
      screenshot: "#0DA5E9",
      mutedFill: isDark ? "#8F98A8" : "#D4DAE3",
      surfaceStroke: isDark ? "#4a5263" : "#dce3e3",
      text: isDark ? "#F3F4F6" : "#0f1613",
      subText: isDark ? "#bdbdbd" : "#505553",
      warning: "#efaf07",
      warningSoft: hexToRgba("#efaf07", isDark ? 0.25 : 0.15),
      danger: "#f40139",
    };
  }, [color, isDark]);

  const {
    periodLabel,
    totalWorkedDisplay,
    totalActiveDisplay,
    totalIdleDisplay,
    suspensionDurationDisplay,
    attendanceRate,
    dailyTrend,
    weeklyBuckets,
    exceptionTrend,
    topTasks,
    taskCount,
  } = useMemo(() => {
    const { dailyTrend, weeklyBuckets } = buildDailyTrendAndWeeklyBuckets(
      data.daily_breakdown,
    );
    const { topTasks, taskCount } = buildTopTasksAndCount(data.projects);

    return {
      periodLabel: `${data.user.name} • ${format(parseISO(data.period.from_date), "dd MMM")} to ${format(parseISO(data.period.to_date), "dd MMM yyyy")} • ${data.user.time_zone}`,
      totalWorkedDisplay: formatHoursAndMinutes(data.summary.total_worked_duration),
      totalActiveDisplay: formatHoursAndMinutes(data.summary.total_active_time),
      totalIdleDisplay: formatHoursAndMinutes(data.summary.total_idle_time),
      suspensionDurationDisplay: formatHoursAndMinutes(
        data.summary.total_suspension_duration,
      ),
      attendanceRate: `${Math.round((data.summary.attended_days / Math.max(data.daily_breakdown.length, 1)) * 100)}%`,
      dailyTrend,
      weeklyBuckets,
      exceptionTrend: buildExceptionTrend(data.attendance),
      topTasks,
      taskCount,
    };
  }, [data]);

  const workloadMix = useMemo(
    () => buildWorkloadMix(data.summary, palette),
    [data.summary, palette],
  );

  const leaveHolidayMix = useMemo(
    () => buildLeaveHolidayMix(data.summary, palette.primary),
    [data.summary, palette.primary],
  );

  const anomalyBySeverity = useMemo(
    () => buildAnomalyBySeverity(data.anomalies, palette),
    [data.anomalies, palette],
  );

  const calendarBarData = useMemo(
    () => buildCalendarBarData(data.daily_breakdown, data.period, palette.primary),
    [data.daily_breakdown, data.period, palette.primary],
  );

  const hasAnomalySeverityData = anomalyBySeverity.length > 0;

  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: isDark ? "#323947" : "#ffffff",
      border: `1px solid ${palette.surfaceStroke}`,
      borderRadius: 16,
      color: palette.text,
    }),
    [isDark, palette.surfaceStroke, palette.text],
  );

  const tooltipTextStyle = useMemo(
    () => ({
      color: palette.text,
    }),
    [palette.text],
  );

  const axisStyle = useMemo(
    () => ({ fill: palette.subText, fontSize: 12 }),
    [palette.subText],
  );

  const legendFormatter = useCallback(
    (value: string) => <span style={tooltipTextStyle}>{value}</span>,
    [tooltipTextStyle],
  );

  const workloadMixTooltipFormatter = useCallback(
    (
      _value: number | string,
      _name: string,
      item: { payload?: WorkloadMixItem },
    ) => item.payload?.displayValue ?? "",
    [],
  );

  const calendarTooltipFormatter = useCallback(
    (value: number | string) => [`${value}h`, "Worked"],
    [],
  );

  const calendarTooltipLabelFormatter = useCallback(
    (
      _label: unknown,
      payload: ReadonlyArray<CalendarTooltipPayload>,
    ) => {
      const item = payload[0]?.payload as CalendarBarItem | undefined;

      if (!item) {
        return "";
      }

      return [
        item.fullLabel,
        `${item.activity}% activity`,
        item.checkIn ? `Check-in ${item.checkIn}` : "",
        item.late > 0 ? `Late ${item.late}m` : "",
        item.early > 0 ? `Early ${item.early}m` : "",
        item.leaveType || "",
        item.holiday || "",
        item.anomalies > 0 ? `${item.anomalies} anomalies` : "",
        item.screenshots > 0 ? `${item.screenshots} screenshots` : "",
      ]
        .filter(Boolean)
        .join(" • ");
    },
    [],
  );

  return (
    <>
      <div className="text-center lg:text-left">
        <h2 className="text-xl md:text-2xl xl:text-3xl font-semibold tracking-tight text-headingTextColor dark:text-darkTextPrimary sm:text-4xl">
          Performance Metrics
        </h2>
        <p className="mt-3 text-sm text-subTextColor dark:text-darkTextSecondary sm:text-base">
          {periodLabel}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
        <KpiTile
          label="Worked Time"
          value={totalWorkedDisplay}
          helper={`${totalActiveDisplay} active • ${totalIdleDisplay} idle`}
        />
        <KpiTile
          label="Average Activity"
          value={`${data.summary.avg_activity}%`}
          helper={`${data.summary.avg_mouse_activity}% mouse • ${data.summary.avg_keyboard_activity}% keyboard`}
        />
        <KpiTile
          label="Attendance Rate"
          value={attendanceRate}
          helper={`${data.summary.late_days} late day(s) • ${data.summary.early_days} early day(s)`}
        />
        <KpiTile
          label="Tracker Signals"
          value={`${data.summary.total_screenshots}`}
          helper={`${data.summary.total_anomalies} anomalies • ${data.summary.total_suspensions} suspensions`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1.5fr_1.1fr]">
        <ChartCard title="Workload Mix">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workloadMix}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={PIE_INNER_RADIUS}
                    outerRadius={PIE_OUTER_RADIUS}
                    stroke="none"
                    paddingAngle={PIE_PADDING_ANGLE}
                  >
                    {workloadMix.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipTextStyle}
                    itemStyle={tooltipTextStyle}
                    formatter={workloadMixTooltipFormatter}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div className="text-center md:text-left">
                <p className="text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary sm:text-4xl">
                  {totalWorkedDisplay}
                </p>
                <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                  Total worked time
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
                    {item.displayValue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Daily Worked vs Activity">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyTrend}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray={GRID_DASH_ARRAY}
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
                  domain={ACTIVITY_DOMAIN}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipTextStyle}
                  itemStyle={tooltipTextStyle}
                />
                <Legend />
                <Bar
                  yAxisId="hours"
                  dataKey="worked"
                  name="Worked Hours"
                  fill={palette.mutedFill}
                  radius={STACK_BAR_RADIUS}
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

        <ChartCard title="Attendance Exceptions">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exceptionTrend}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray={GRID_DASH_ARRAY}
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
                  labelStyle={tooltipTextStyle}
                  itemStyle={tooltipTextStyle}
                />
                <Legend />
                <Bar
                  dataKey="late"
                  name="Late Minutes"
                  stackId="a"
                  fill={palette.danger}
                  radius={STACK_BAR_RADIUS}
                />
                <Bar
                  dataKey="early"
                  name="Early Minutes"
                  stackId="a"
                  fill={palette.warning}
                  radius={STACK_BAR_RADIUS}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>


      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_0.9fr]">
        <ChartCard title="Top Task Hours">
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topTasks}
                layout="vertical"
                margin={TASK_BAR_MARGIN}
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray={GRID_DASH_ARRAY}
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
                  labelStyle={tooltipTextStyle}
                  itemStyle={tooltipTextStyle}
                />
                <Legend />
                <Bar
                  dataKey="hours"
                  name="Hours"
                  fill={palette.primary}
                  radius={HORIZONTAL_BAR_RADIUS}
                />
                <Bar
                  dataKey="activity"
                  name="Activity %"
                  fill={palette.primarySoft}
                  radius={HORIZONTAL_BAR_RADIUS}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

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
      </div>



      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <ChartCard title="Weekly Output Trend">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyBuckets}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray={GRID_DASH_ARRAY}
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
                  labelStyle={tooltipTextStyle}
                  itemStyle={tooltipTextStyle}
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
                  fill={palette.warningSoft}
                  fillOpacity={1}
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

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
              helper={`Duration ${suspensionDurationDisplay}`}
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
      </div>


      <div>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
          <ChartCard title="Daily Breakdown Trend">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyTrend}>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray={GRID_DASH_ARRAY}
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
                    domain={ACTIVITY_DOMAIN}
                    tickLine={false}
                    axisLine={false}
                    tick={axisStyle}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipTextStyle}
                    itemStyle={tooltipTextStyle}
                  />
                  <Legend />
                  <Bar
                    yAxisId="hours"
                    dataKey="active"
                    name="Active Hours"
                    fill={palette.primary}
                    radius={STACK_BAR_RADIUS}
                  />
                  <Bar
                    yAxisId="hours"
                    dataKey="idle"
                    name="Idle Hours"
                    fill={palette.warning}
                    radius={STACK_BAR_RADIUS}
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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={anomalyBySeverity}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={PIE_INNER_RADIUS}
                      outerRadius={PIE_OUTER_RADIUS}
                      stroke="none"
                      paddingAngle={PIE_PADDING_ANGLE}
                    >
                      {anomalyBySeverity.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={tooltipTextStyle}
                      itemStyle={tooltipTextStyle}
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
            <div className="rounded-[8px] border border-borderColor/70 bg-bgSecondary/50 px-3 py-2 dark:border-darkBorder dark:bg-darkPrimaryBg/50">
              <span className="inline-block size-2 rounded-full bg-primary" />
              <span className="ml-2">Normal workday</span>
            </div>
            <div className="rounded-[8px] border border-borderColor/70 bg-bgSecondary/50 px-3 py-2 dark:border-darkBorder dark:bg-darkPrimaryBg/50">
              <span className="inline-block size-2 rounded-full bg-rose-500" />
              <span className="ml-2">Leave</span>
            </div>
            <div className="rounded-[8px] border border-borderColor/70 bg-bgSecondary/50 px-3 py-2 dark:border-darkBorder dark:bg-darkPrimaryBg/50">
              <span className="inline-block size-2 rounded-full bg-sky-500" />
              <span className="ml-2">Holiday</span>
            </div>
            <div className="rounded-[8px] border border-borderColor/70 bg-bgSecondary/50 px-3 py-2 dark:border-darkBorder dark:bg-darkPrimaryBg/50">
              <span className="inline-block size-2 rounded-full bg-amber-500" />
              <span className="ml-2">Late / Early</span>
            </div>
          </div>

          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calendarBarData}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray={GRID_DASH_ARRAY}
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
                  labelStyle={tooltipTextStyle}
                  itemStyle={tooltipTextStyle}
                  formatter={calendarTooltipFormatter}
                  labelFormatter={calendarTooltipLabelFormatter}
                />
                <Legend />
                <Bar
                  dataKey="hours"
                  name="Worked Hours"
                  radius={STACK_BAR_RADIUS}
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
                    strokeDasharray={GRID_DASH_ARRAY}
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
                    labelStyle={tooltipTextStyle}
                    itemStyle={tooltipTextStyle}
                  />
                  <Legend formatter={legendFormatter} />
                  <Bar
                    dataKey="screenshots"
                    name="Screenshots"
                    fill={palette.screenshot}
                    stroke={palette.screenshot}
                    radius={STACK_BAR_RADIUS}
                  />
                  <Bar
                    dataKey="anomalies"
                    name="Anomalies"
                    fill={palette.danger}
                    radius={STACK_BAR_RADIUS}
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
                    innerRadius={PIE_INNER_RADIUS}
                    outerRadius={PIE_OUTER_RADIUS}
                    stroke="none"
                    paddingAngle={PIE_PADDING_ANGLE}
                  >
                    {leaveHolidayMix.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipTextStyle}
                    itemStyle={tooltipTextStyle}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </>
  );
};

export default memo(PerformanceCharts);
