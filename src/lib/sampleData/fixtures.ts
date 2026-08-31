import {
  ICoreMember,
  IDashboardStats,
  IDuration,
  IMembersStatsDashboard,
  IProject,
  IRowAppsUrls,
  ITask,
  IUser,
  User,
} from "@/types/type";
import { IDashboardInsight } from "@/components/Dashboard/insights/Insights";

/**
 * Demo fixtures shown to brand-new organizations before any time has been
 * tracked (see `getSampleDataMode`). Shapes mirror the live API exactly:
 * every duration is a decimal-hours float paired with a zero-padded
 * "HH:MM:SS" string (backend `convertDecimalHoursToHMS`), stat values and
 * change chips arrive pre-formatted, and `weekly_chart` keys are string day
 * indices where "0" is today. All ids are negative so a stray mutation can
 * never touch a real record.
 */

type StatsType = "daily" | "weekly" | "monthly";

const dur = (h: number, m: number, s: number): IDuration => ({
  hours: Number((h + m / 60 + s / 3600).toFixed(3)),
  formatted: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
});

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString();
const daysFromNow = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString();

interface SamplePerson {
  id: number;
  name: string;
  email: string;
}

const PEOPLE: SamplePerson[] = [
  { id: -1, name: "Maya Iqbal", email: "maya@sample.demo" },
  { id: -2, name: "Daniel Reyes", email: "daniel@sample.demo" },
  { id: -3, name: "Sofia Novak", email: "sofia@sample.demo" },
  { id: -4, name: "Ethan Park", email: "ethan@sample.demo" },
  { id: -5, name: "Liam Osei", email: "liam@sample.demo" },
];

const asUser = (p: SamplePerson): User => ({
  id: p.id,
  name: p.name,
  email: p.email,
  image: null,
});

const asFullUser = (p: SamplePerson, role: string): IUser => ({
  id: p.id,
  company_id: -1,
  name: p.name,
  email: p.email,
  phone: "",
  image: "",
  role,
  is_active: true,
  is_deleted: false,
  is_tracking: false,
  url_tracking: false,
  time_zone: "UTC",
  multi_factor_auth: false,
  updated_at: daysAgo(1),
  created_at: daysAgo(30),
});

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const sampleStats = (type: StatsType): IDashboardStats => {
  const byType = {
    daily: {
      activity: { value: "78%", change: "+5.2%" },
      work: { value: "05:24:36", raw_hours: 5.41, change: "+1.2h" },
      projects: { change: "+1.0" },
      members: { change: "+25%" },
    },
    weekly: {
      activity: { value: "74%", change: "+3.8%" },
      work: { value: "27:45:12", raw_hours: 27.753, change: "+4.5h" },
      projects: { change: "+2.0" },
      members: { change: "+25%" },
    },
    monthly: {
      activity: { value: "76%", change: "+6.1%" },
      work: { value: "112:36:00", raw_hours: 112.6, change: "+18.4h" },
      projects: { change: "+3.0" },
      members: { change: "+66.7%" },
    },
  }[type];

  return {
    activity: {
      label: `${capitalize(type)} Activity`,
      value: byType.activity.value,
      change: byType.activity.change,
      is_improved: true,
    },
    work: {
      label: `${capitalize(type)} Work`,
      value: byType.work.value,
      change: byType.work.change,
      is_improved: true,
      raw_hours: byType.work.raw_hours,
    },
    projects: {
      label: "Total Projects",
      value: "4",
      change: byType.projects.change,
      is_improved: true,
    },
    members: {
      label: "Team Members",
      value: "5",
      change: byType.members.change,
      is_improved: true,
    },
  };
};

export const sampleInsights = (type: string): IDashboardInsight => {
  const byType: Record<string, { active: number; idle: number; productive: number }> = {
    daily: { active: 72, idle: 28, productive: 58 },
    weekly: { active: 78, idle: 22, productive: 64 },
    monthly: { active: 75, idle: 25, productive: 61 },
  };

  return {
    period: type,
    data: byType[type] ?? byType.daily,
  };
};

const coreMember = (
  p: SamplePerson,
  activity: number,
  work: IDuration,
  active: IDuration,
  idle: IDuration,
  rank: number,
): ICoreMember => ({
  user_id: p.id,
  name: p.name,
  email: p.email,
  image: "",
  work_duration: work,
  idle_duration: idle,
  active_duration: active,
  activity,
  projects_count: 2,
  tasks_count: 4,
  rank,
});

export const sampleCoreMembers = (type: string): ICoreMember[] =>
  type === "lowest"
    ? [
        coreMember(PEOPLE[3], 48, dur(41, 12, 30), dur(28, 5, 0), dur(13, 7, 30), 3),
        coreMember(PEOPLE[4], 55, dur(56, 40, 15), dur(39, 22, 0), dur(17, 18, 15), 2),
        coreMember(PEOPLE[2], 61, dur(72, 8, 45), dur(52, 30, 0), dur(19, 38, 45), 1),
      ]
    : [
        coreMember(PEOPLE[0], 94, dur(118, 24, 10), dur(104, 12, 0), dur(14, 12, 10), 1),
        coreMember(PEOPLE[1], 89, dur(104, 45, 30), dur(89, 20, 0), dur(15, 25, 30), 2),
        coreMember(PEOPLE[2], 83, dur(97, 12, 5), dur(81, 40, 0), dur(15, 32, 5), 3),
      ];

const memberStats = (
  p: SamplePerson,
  todayPct: number,
  weekPct: number,
  today: IDuration,
  week: IDuration,
  task: { task_name: string; project_name: string },
  lastActive: string,
  chart: [number, number, number, number, number, number, number],
): IMembersStatsDashboard => ({
  user_id: p.id,
  name: p.name,
  email: p.email,
  image: null,
  today: {
    work_duration: today,
    idle_duration: dur(0, 38, 0),
    active_duration: today,
    activity_percentage: todayPct,
  },
  this_week: {
    work_duration: week,
    idle_duration: dur(3, 10, 0),
    active_duration: week,
    activity_percentage: weekPct,
  },
  projects_assigned: 2,
  current_task: task,
  last_active: lastActive,
  weekly_chart: {
    "0": chart[0],
    "1": chart[1],
    "2": chart[2],
    "3": chart[3],
    "4": chart[4],
    "5": chart[5],
    "6": chart[6],
  },
});

export const sampleMembersStats: IMembersStatsDashboard[] = [
  memberStats(
    PEOPLE[0],
    82,
    79,
    dur(6, 42, 13),
    dur(32, 15, 0),
    { task_name: "Design homepage wireframes", project_name: "Website Redesign" },
    "Less than 1h ago",
    [76, 82, 64, 88, 71, 12, 0],
  ),
  memberStats(
    PEOPLE[1],
    58,
    62,
    dur(4, 55, 40),
    dur(26, 30, 0),
    { task_name: "Implement OAuth sign-in", project_name: "Mobile App v2.0" },
    "2h ago",
    [58, 65, 71, 49, 60, 0, 8],
  ),
  memberStats(
    PEOPLE[2],
    41,
    48,
    dur(3, 20, 5),
    dur(19, 45, 0),
    { task_name: "Draft launch announcement", project_name: "Q4 Marketing Campaign" },
    "5h ago",
    [41, 38, 52, 46, 55, 5, 0],
  ),
  memberStats(
    PEOPLE[3],
    18,
    24,
    dur(1, 12, 50),
    dur(8, 40, 0),
    { task_name: "QA regression checklist", project_name: "Mobile App v2.0" },
    "1d ago",
    [18, 0, 26, 31, 22, 0, 0],
  ),
];

export const sampleAppsAndUrls: IRowAppsUrls[] = [
  { app_name: "Chrome", today_duration: "02:10:44", total_duration: "11:32:08" },
  { app_name: "VS Code", today_duration: "02:56:01", total_duration: "13:40:19" },
  { app_name: "Figma", today_duration: "01:48:12", total_duration: "08:15:33" },
  { app_name: "Zoom", today_duration: "00:52:30", total_duration: "04:05:12" },
  { app_name: "Microsoft Teams", today_duration: "00:41:15", total_duration: "03:28:47" },
];

const project = (
  id: number,
  name: string,
  status: string,
  startDaysAgo: number,
  deadlineInDays: number,
  budget: number,
  manager: SamplePerson,
  assignees: SamplePerson[],
): IProject => ({
  id,
  company_id: -1,
  name,
  client_id: null,
  status,
  description: null,
  start_date: daysAgo(startDaysAgo),
  deadline: daysFromNow(deadlineInDays),
  is_idle_time: true,
  budget,
  client: null,
  projectAssigns: assignees.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    image: null,
    duration: "00:00:00",
    user: asUser(p),
    assignedBy: { id: manager.id, name: manager.name },
    assigned_at: daysAgo(startDaysAgo),
  })),
  projectManagerAssigns: [{ user: asUser(manager) }],
  summary: { spend: "0", is_over_budget: false, duration: "00:00:00" },
});

export const sampleProjects = (): IProject[] => [
  project(-101, "Website Redesign", "processing", 21, 24, 12000, PEOPLE[0], [
    PEOPLE[1],
    PEOPLE[2],
    PEOPLE[3],
  ]),
  project(-102, "Mobile App v2.0", "pending", 10, 50, 18500, PEOPLE[1], [
    PEOPLE[0],
    PEOPLE[4],
  ]),
  project(-103, "Q4 Marketing Campaign", "processing", 14, 35, 6400, PEOPLE[2], [
    PEOPLE[4],
    PEOPLE[3],
  ]),
  project(-104, "Customer Portal", "complete", 60, 5, 9800, PEOPLE[0], [
    PEOPLE[1],
    PEOPLE[2],
  ]),
];

const task = (
  id: number,
  name: string,
  projectId: number,
  projectName: string,
  priority: string,
  status: ITask["status"],
  duration: string,
  assignedBy: SamplePerson,
  assignee: SamplePerson,
): ITask => ({
  id,
  company_id: -1,
  project_id: projectId,
  user_id: assignee.id,
  name,
  description: null,
  deadline: daysFromNow(14),
  priority,
  assigned_by: assignedBy.id,
  status,
  updated_at: daysAgo(1),
  created_at: daysAgo(7),
  duration,
  project: { id: projectId, name: projectName },
  assignedBy: asFullUser(assignedBy, "manager"),
  user: asFullUser(assignee, "employee"),
});

export const sampleTasks = (): ITask[] => [
  task(-201, "Design homepage wireframes", -101, "Website Redesign", "high", "processing", "04:12:30", PEOPLE[0], PEOPLE[2]),
  task(-202, "Implement OAuth sign-in", -102, "Mobile App v2.0", "medium", "processing", "06:45:10", PEOPLE[1], PEOPLE[0]),
  task(-203, "Draft launch announcement", -103, "Q4 Marketing Campaign", "low", "pending", "01:20:45", PEOPLE[2], PEOPLE[4]),
  task(-204, "QA regression checklist", -102, "Mobile App v2.0", "high", "pending", "02:05:18", PEOPLE[3], PEOPLE[3]),
];
