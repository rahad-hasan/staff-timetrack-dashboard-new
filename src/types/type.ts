/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
  meta?: IMeta | null;
}

type TRole = "project_manager" | "admin" | "hr" | "manager" | "employee";

export interface ISigninResponse {
  id: number;
  company_id: number;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: TRole;
  is_active: boolean;
  last_deactivate: string | null; // ISO datetime
  is_deleted: boolean;
  is_tracking: boolean;
  url_tracking: boolean;
  pay_rate_hourly: number;
  time_zone: string;
  multi_factor_auth: boolean;
  updated_at: string; // ISO datetime
  created_at: string; // ISO datetime
  userOtpId: number | null;
  accessToken: string;
  refreshToken: string;
}

export interface IUser {
  id: number;
  company_id: number;
  name: string;
  email: string;
  phone: string;
  image: string;
  role: string;
  is_active: boolean;
  is_deleted: boolean;
  is_tracking: boolean;
  url_tracking: boolean;
  pay_rate_hourly: number;
  time_zone: string;
  multi_factor_auth: boolean;
  updated_at: string;
  created_at: string;
}

export interface IMember extends IUser {
  project: number;
}

export type SearchParams = { [key: string]: string | string[] | undefined };

export interface IMutation<T> {
  data: T;
  id: number | undefined;
}

export interface ProjectAssign {
  user: User;
  assignedBy: {
    id: number;
    name: string;
  };
  assigned_at: string;
}

export interface ProjectManagerAssign {
  user: User;
}
// project types
export type ProjectStatus = "pending" | "active" | "completed" | "archived";

export interface User {
  id: number;
  name: string;
  email: string;
  image: string | null;
}

export interface ProjectSummary {
  spend: string;
  is_over_budget: boolean;
  duration: string;
}

export interface IProject {
  id: number;
  company_id: number;
  name: string;
  client_id: number | null;
  status: string;
  description: string | null;
  start_date: string;
  deadline: string | null;
  is_idle_time: boolean;
  budget: number | null;
  client: Client | null;
  projectAssigns: ProjectAssign[];
  projectManagerAssigns: ProjectManagerAssign[];
  summary: ProjectSummary;
}

export interface ICreateProjectPayload {
  name: string;
  client_id: number | string;
  manager_ids: number[] | string[];
  user_ids: number[];
  status?: string;
  description: string;
  start_date: string;
  deadline: string;
  budget: number | string;
}

export interface ITask {
  id: number;
  company_id: number;
  project_id: number;
  user_id: number;
  name: string;
  description: string | null;
  deadline: string | null;
  priority: string | null;
  assigned_by: number;
  status: "pending" | "processing" | "complete" | "cancelled";
  updated_at: string;
  created_at: string;
  duration: string;
  project: {
    id: number;
    name: string;
  };
  assignedBy: IUser;
  user: IUser;
}

export interface ISingleTask {
  id: number;
  name: string;
  deadline: string | null;
  description: string | null;
  status: string;
  project_id: number;
  project_name: string;
  user_id: number;
  user_name: string;
  assigned_user_id: number;
  assigned_user_name: string;
  email: string;
  image: string | null;
  duration: string;
}

export type ISearchParams = Promise<{
  [key: string]: string | string[] | number | undefined;
}>;

export interface ISearchParamsProps {
  searchParams: ISearchParams;
}

export interface ITimeSheetEntry {
  id: number;
  company_id: number;
  user_id: number;
  project_id: number;
  task_id: number | null;
  time_entries_id: number;
  start_time: string;
  end_time: string;
  duration: number;
  system_update: string;
  status: "pending" | "processing" | "complete" | "cancelled";
  updated_at: string;
  created_at: string;
  project: {
    id: number;
    name: string;
  };
  task: any | null;
  timeEntry: {
    id: number;
    is_manual_entry: boolean;
  };

  format_start_time: string; // e.g. "02:35 PM"
  format_end_time: string; // e.g. "07:16 PM"
  format_duration: string; // e.g. "04:41:40"

  start: number; // decimal hour (14.58)
  end: number; // decimal hour (19.26)
}

export interface Company {
  id: number;
  name: string;
  phone: string;
  address: string;
  email: string;
}

export interface ILeaveRequest {
  id: number;
  company_id: number;
  user_id: number;
  type: string;
  start_date: string;
  end_date: string;
  leave_count: number;
  reason: string;
  hr_approved: boolean;
  admin_approved: boolean;
  is_rejected: boolean;
  rejected_by: number | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  user: User;
  company: Company;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export interface IManualTimeEntry {
  id: number;
  start_time: string;
  end_time: string;
  duration: number;
  status: "pending" | "processing" | "complete" | "cancelled";
  user_id: number;
  project_id: number;
  task_id: number;
  system_update: string;
  notes: string | null;
  created_at: string;
  user: User;
  project: Project;
  date: string;
  format_start_time: string;
  format_end_time: string;
}

export interface IApps {
  id: number;
  company_id: number;
  user_id: number;
  app_id: number | null;
  project_id: number;
  task_id: number;
  date: string;
  app_name: string;
  url: string;
  duration: string;
  tab_id: number | null;
  updated_at: string;
  created_at: string;
  user: User;
  project: Project;
}

export interface IUrls {
  id: number;
  company_id: number;
  user_id: number;
  app_id: number | null;
  project_id: number;
  task_id: number;
  date: string;
  app_name: string;
  url: string;
  duration: string;
  tab_id: number | null;
  updated_at: string;
  created_at: string;
  user: User;
  project: Project;
}

export interface IStatItem {
  label: string;
  value: string;
  change: string;
  is_improved: boolean;
}

export interface IWorkStat extends IStatItem {
  raw_hours: number;
}

export interface IDashboardStats {
  activity: IStatItem;
  work: IWorkStat;
  projects: IStatItem;
  members: IStatItem;
}

export interface IDuration {
  hours: number;
  formatted: string;
}

export interface ICoreMember {
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

export interface ILeaveStats {
  allowed: number;
  taken: number;
  remaining: number;
}

export interface ILeaveDetails {
  paid_leave: number;
  casual_leave: number;
  sick_leave: number;
  maternity_leave: number;
}

export interface IUserLeaveData {
  user: User;
  year: number;
  total_allowed: number;
  total_taken: number;
  total_remaining: number;
  available: number;
  casual: ILeaveStats;
  sick: ILeaveStats;
  maternity: ILeaveStats;
  paid: ILeaveStats;
}

export interface ILeaveDetailsResponse {
  data: IUserLeaveData[];
  details: ILeaveDetails;
}

export type ICompany = {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  has_trialed_once: boolean;
  address: string;
  time_zone: string;
  idle_minutes_limit: number;
  url_tracking_enabled: boolean;
  week_start: string;
  paid_leave: number;
  casual_leave: number;
  sick_leave: number;
  maternity_leave: number;
  app_notify: boolean;
  email_notify: boolean;
  updated_at: string;
  created_at: string;
};

// Members Stats in Dashboard
export interface IDuration {
  hours: number;
  formatted: string;
}

export interface IActivityStats {
  work_duration: IDuration;
  idle_duration: IDuration;
  active_duration: IDuration;
  activity_percentage: number;
}

export interface ICurrentTask {
  task_name: string;
  project_name: string;
}

export type WeeklyChartData = Record<
  "0" | "1" | "2" | "3" | "4" | "5" | "6",
  number
>;

export interface IMembersStatsDashboard {
  user_id: number;
  name: string;
  email: string;
  image: string | null;
  today: IActivityStats;
  this_week: IActivityStats;
  projects_assigned: number;
  current_task: ICurrentTask | null;
  last_active: string;
  weekly_chart: WeeklyChartData;
}

export interface Task {
  id: number | null;
  name: string | null;
  description?: string | null;
  duration?: string;
  user: User;
  status?: string;
}

export interface TimeSpan {
  start: string;
  end: string;
  start_local: string;
  end_local: string;
}

export interface IDailyTimeEntryItem {
  project: Project;
  task: Task;
  is_manual: boolean;
  total_duration_hours: number;
  total_duration_formatted: string;
  activity_score_avg: number | null;
  span: TimeSpan;
}

export interface IDailyTimeTrackerData {
  user_id: number;
  time_zone: string;
  date: string;
  totals: {
    duration_hours: number;
    duration_formatted: string;
  };
  items: IDailyTimeEntryItem[];
}

// ===========================
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  company_id: number;
  is_active: boolean;
  updated_at: string;
  created_at: string;
}

export interface ProjectAssign {
  user: User;
  assignedBy: {
    id: number;
    name: string;
  };
  assigned_at: string;
}

export interface ProjectSummary {
  spend: string;
  is_over_budget: boolean;
  duration: string;
}

export interface ISingleProjectData {
  id: number;
  company_id: number;
  name: string;
  client_id: number;
  status: string;
  description: string;
  start_date: string;
  deadline: string;
  is_idle_time: boolean;
  budget: number;
  client: Client;
  projectManagerAssigns: { user: User }[];
  tasks: Task[];
  projectAssigns: ProjectAssign[];
  summary: ProjectSummary;
}

export interface AnomalyDetails {
  type?: string;
  reason?: string;
  detected?: boolean;
  severity?: "low" | "medium" | "high";
}
export interface IAllScreenshot {
  id: number;
  image: string;
  corrupted: string;
  time: string;
  format_time: string;
  display_name: string;
  score: number;
  mouse_activity: number;
  keyboard_activity: number;
  duration: number;
  anomaly: AnomalyDetails;
  project_name: string;
  task_name: string;
}

export interface INotificationItem {
  id: number;
  company_id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  reason: string;
  data: {
    id: number;
    date: string;
    name: string;
    deadline?: string;
    note: string;
  };
  created_at: string;
  updated_at: string;
}

export interface IRowAppsUrls {
  app_name: string;
  today_duration: string;
  total_duration: string;
}

export interface IDashboardAppsAndUrls {
  title: string;
  from: string;
  to: string;
  row: IRowAppsUrls[];
}

export interface INotes {
  notes: string;
  start_time: string;
  end_time: string;
  project: Project;
  task: Task;
  user: User;
}

/* =========================
 * Timeline Detail (Screenshot / Activity)
 * ========================= */
export type TTimelineDetail = {
  id: number;
  project_name: string;
  task_name: string | null;
  user_id: number;
  company_id: number;

  score: number;
  mouse_activity: number;
  keyboard_activity: number;
  duration: number; // seconds

  corrupted: "NONE" | "PARTIAL" | "FULL";
  anomaly: Record<string, any>;

  image: string;
  display_name: string;

  time: string; // ISO UTC string
  format_time: string; // e.g. "05:17 PM"
};

/* =========================
 * Timeline Slots
 * ========================= */

// Empty 10-minute slot
export type TTimelineEmptySlot = {
  type: "empty";
  from_time: string; // UTC ISO
  to_time: string; // UTC ISO
};

// Slot with data
export type TTimelineDataSlot = {
  type: "data";

  from_time: string; // UTC ISO
  to_time: string; // UTC ISO

  date: string; // start of day UTC

  avg_score: number;
  avg_mouse_activity: number;
  avg_keyboard_activity: number;

  total_duration: number; // minutes (0–10)

  details: TTimelineDetail[];

  // internal/computed (can be omitted on frontend if desired)
  fromTs: number;
  hourKeyUTC: string;

  // formatted for UI (user timezone)
  format_from_time: string; // "05:10 PM"
  format_to_time: string; // "05:20 PM"
};

// Slot union
export type TTimelineSlot = TTimelineDataSlot | TTimelineEmptySlot;

/* =========================
 * Hour Block
 * ========================= */
export type TTimelineHourBlock = {
  hourLabel: string; // "05:00 PM - 06:00 PM"
  totalWorked: string; // HH:mm:ss
  slots: TTimelineSlot[];
};

export type TimeSheetDailyItem = {
  date: string; // YYYY-MM-DD
  duration: string; // HH:MM:SS
};

export type TimeSheetRange = {
  from_date: string; // YYYY-MM-DD
  to_date: string; // YYYY-MM-DD
  type: "single_day" | "range";
};

export type TimeSheetTotals = {
  duration_hours: string; // decimal hours as string, e.g. "20.975"
  duration_formatted: string; // HH:MM:SS
};

export type TimeSheetData = {
  user_id: number;
  time_zone: string; // e.g. "UTC"
  range: TimeSheetRange;
  daily_data: TimeSheetDailyItem[];
  totals: TimeSheetTotals;
};

export interface ISchedules {
  name: string;
  start_time: string;
  end_time: string;
  grace_in_min: number;
  grace_out_min: number;
  allow_overtime?: boolean;
  _count?: { scheduleAssigns: number };
  start_time_local?: string;
  end_time_local?: string;
}

export type TLeaveType = "sick" | "casual" | "paid" | "maternity" | null;

export interface IDailyDataItem {
  date: string; // ISO date string (e.g. "2026-02-01")
  duration: string; // HH:mm:ss
  activity: number; // percentage (0–100)
  active_time: string; // HH:mm:ss
  idle_time: string; // HH:mm:ss
  leave_type: TLeaveType;
}

export interface IDailyReportResponse {
  daily_data: IDailyDataItem[];
  total_time: string; // HH:mm:ss
  total_idle_time: string; // HH:mm:ss
  total_active_time: string; // HH:mm:ss
  activity: number; // overall activity %
}
