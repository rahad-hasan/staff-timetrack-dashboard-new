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
  time_zone?: string;
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
  notes?: string;
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
  leave_type_id: number;
  start_date: string;
  end_date: string;
  leave_count: number;
  approved_hours: number;
  approved_hours_formatted: string;
  reason: string;
  hr_approved: boolean;
  admin_approved: boolean;
  is_rejected: boolean;
  rejected_by: number | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  status: LeaveStatus;
  leaveType: LeaveType;
  user?: LeaveUser;
  company?: Company;
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
  task?: { id: number; name: string };
  system_update: string;
  notes: string | null;
  created_at: string;
  user: User;
  project: Project;
  date: string;
  format_start_time: string;
  format_end_time: string;
}

export interface IUrl {
  url: string;
  duration: string;
  session: number;
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
  user: LeaveUser;
  year: number;
  total_allowed: number;
  total_taken: number;
  total_remaining: number;
  available: number;
  approved_leave_hours: number;
  approved_leave_hours_formatted: string;
  leave_types: LeaveTypeSummary[];
}

export interface ILeaveDetailsResponse {
  data: IUserLeaveData[];
  details: {
    year: number;
    leave_types: LeaveType[];
  };
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
  id?: number;
  name: string;
  start_time: string;
  end_time: string;
  grace_in_min: number;
  grace_out_min: number;
  break_in_min: number;
  allow_overtime?: boolean;
  _count?: { scheduleAssigns: number };
  scheduleAssigns?: [{ user: User }];
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
  is_manual_entry: boolean;
  is_manual_entry_approved: boolean;
}

export interface IDailyReportResponse {
  daily_data: IDailyDataItem[];
  total_time: string; // HH:mm:ss
  total_idle_time: string; // HH:mm:ss
  total_active_time: string; // HH:mm:ss
  activity: number; // overall activity %
}

export interface IUserWorkReport {
  user: User;
  schedule: {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    grace_in_min: number;
    grace_out_min: number;
    allow_overtime: boolean;
  };
  time_zone: string;
  from_date: string;
  to_date: string;
  summary: {
    late_days: number;
    early_days: number;
    total_late_minutes: number;
    total_early_minutes: number;
    total_late_hm: string;
    total_early_hm: string;
    total_worked_duration: string;
    earnings: null | number;
  };
  days: {
    date: string;
    check_in: string;
    check_out: string;
    check_in_local: string;
    check_out_local: string;
    late_minutes: number;
    early_minutes: number;
    late_hm: string;
    early_hm: string;
    worked_duration: string;
  }[];
}

export interface IApp {
  app_name: string;
  duration: string;
  session: number;
}





export interface LeaveType {
  id: number;
  title: string;
  color_code: string;
  is_active: boolean;
  days_allowed: number;
  requires_document: boolean;
  applicable_gender: LeaveApplicableGender;
  min_notice_days: number | null;
  allow_past_dates: boolean;
  company_id: number;
  created_at: string;
  updated_at: string;
}

export type LeaveApplicableGender = "male" | "female" | "other" | "all";
export type ApplicableGender = LeaveApplicableGender;

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveTypeRecord extends LeaveType {
  leave_requests_count: number;
  can_delete: boolean;
}

export interface LeaveTypeSummary {
  id: number;
  title: string;
  color_code: string;
  is_active: boolean;
  requires_document: boolean;
  applicable_gender: LeaveApplicableGender;
  min_notice_days: number | null;
  allow_past_dates: boolean;
  allowed: number;
  taken: number;
  remaining: number;
  approved_hours: number;
  approved_hours_formatted: string;
}

export interface UserScopedLeaveTypeRecord extends LeaveTypeRecord {
  allowed: number;
  taken: number;
  remaining: number;
  approved_hours: number;
  approved_hours_formatted: string;
}

export interface LeaveCalendarLeaveItem {
  type: "leave";
  title: string;
  id: number;
  status: LeaveStatus;
  color?: string | null;
  reason?: string | null;
  username?: string | null;
}

export interface LeaveCalendarHolidayItem {
  type: "holiday";
  title: string;
  description?: string | null;
  source?: string | null;
}

export type LeaveCalendarDayItem =
  | LeaveCalendarLeaveItem
  | LeaveCalendarHolidayItem;

export interface LeaveCalendarFilters {
  [key: string]: string | number | boolean | undefined;
  year?: string | number;
  month?: string | number;
  user_id?: string | number;
}

export interface LeaveCalendarData {
  days: Record<string, LeaveCalendarDayItem[]>;
}

//  leave history
export interface LeaveUser {
  id: number;
  name: string;
  image: string | null;
  email: string;
  gender: "male" | "female" | "other";
}


export interface LeaveRecord {
  id: number;
  company_id: number;
  user_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  leave_count: number;
  approved_hours: number;
  approved_hours_formatted: string;
  reason: string;
  hr_approved: boolean;
  admin_approved: boolean;
  is_rejected: boolean;
  rejected_by: number | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  status: LeaveStatus;
  leaveType: LeaveType;
  user?: LeaveUser;
  company?: Company;
}

export interface AdminLeaveHistoryFilters {
  [key: string]: string | number | boolean | undefined;
  user_id?: number;
  start_date?: string;
  end_date?: string;
  status?: LeaveStatus;
}

export interface LeaveHoliday {
  id?: number;
  name: string;
  date: string;
  duration?: number | null;
  description?: string | null;
  source?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MandatoryLeaveImportPayload {
  holidays: Array<Pick<LeaveHoliday, "name" | "date" | "description" | "source">>;
}

export interface MandatoryLeaveParsePayload {
  file_name: string;
  file_content: string;
  file_encoding: "text" | "base64";
}

export interface MandatoryLeaveParsedHoliday extends LeaveHoliday {
  row: number;
  already_exists: boolean;
}

export interface MandatoryLeaveRejectedRow {
  row: number;
  reason: string;
  raw: unknown;
}

export interface MandatoryLeaveParseSummary {
  total_rows: number;
  parsed_count: number;
  rejected_count: number;
  existing_count: number;
}

export interface MandatoryLeaveParseResult {
  parsed: MandatoryLeaveParsedHoliday[];
  rejected: MandatoryLeaveRejectedRow[];
  summary: MandatoryLeaveParseSummary;
}

export interface LeaveTypeListFilters {
  [key: string]: string | number | boolean | undefined;
  search?: string;
  is_active?: boolean;
}

export interface LeaveTypeRecord extends LeaveType {
  leave_requests_count: number;
  can_delete: boolean;
}

export interface CreateLeaveTypePayload {
  title: string;
  color_code: string;
  days_allowed: number;
  requires_document?: boolean;
  is_active?: boolean;
  applicable_gender?: ApplicableGender;
  min_notice_days?: number | null;
  allow_past_dates?: boolean;
}

export interface UpdateLeaveTypePayload {
  title?: string;
  color_code?: string;
  days_allowed?: number;
  requires_document?: boolean;
  is_active?: boolean;
  applicable_gender?: ApplicableGender;
  min_notice_days?: number | null;
  allow_past_dates?: boolean;
}

export interface CreateLeaveHolidayPayload {
  name: string;
  date: string;
  duration: number;
  description?: string;
  source: string;
}
export interface UpdateLeaveHolidayPayload {
  name?: string;
  date?: string;
  duration?: number;
  description?: string;
  source?: string;
}
export interface LeaveHoliday {
  id?: number;
  name: string;
  date: string;
  duration?: number | null;
  description?: string | null;
  source?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type LeaveHolidayListData =
  | LeaveHoliday[]
  | {
      holidays?: LeaveHoliday[];
      data?: LeaveHoliday[];
    };

export interface LeaveRequestTypeDropdownRecord {
  id: number;
  title: string;
  color_code: string;
  requires_document: boolean;
  applicable_gender: LeaveApplicableGender;
  min_notice_days: number | null;
  allow_past_dates: boolean;
  days_allowed: number;
  taken: number;
  left: number;
}


export interface UserLeaveSummary {
  user: LeaveUser;
  year: number;
  summary: {
    total_allowed: number;
    total_taken: number;
    total_remaining: number;
    available_percentage: number;
    available_leaves: number;
    approved_leave_hours: number;
    approved_leave_hours_formatted: string;
    leave_types: LeaveTypeSummary[];
  };
  requests: {
    pending: LeaveRecord[];
    approved: LeaveRecord[];
    rejected: LeaveRecord[];
  };
  next_holidays: LeaveHoliday[];
}

export interface LeaveRequestTypeDropdownRecord {
  id: number;
  title: string;
  color_code: string;
  requires_document: boolean;
  applicable_gender: LeaveApplicableGender;
  min_notice_days: number | null;
  allow_past_dates: boolean;
  days_allowed: number;
  taken: number;
  left: number;
}


export interface UserLeaveSummary {
  user: LeaveUser;
  year: number;
  summary: {
    total_allowed: number;
    total_taken: number;
    total_remaining: number;
    available_percentage: number;
    available_leaves: number;
    approved_leave_hours: number;
    approved_leave_hours_formatted: string;
    leave_types: LeaveTypeSummary[];
  };
  requests: {
    pending: LeaveRecord[];
    approved: LeaveRecord[];
    rejected: LeaveRecord[];
  };
  next_holidays: LeaveHoliday[];
}

/* =========================
 * Event Management
 * ========================= */
export type EventConferenceProvider = "google_meet" | "microsoft_teams" | null;
export type EventSyncTarget = "google" | "microsoft";
export type EventSyncStatus =
  | "not_requested"
  | "pending_connection"
  | "pending"
  | "processing"
  | "synced"
  | "failed";

export interface EventOrganizerSync {
  user_id: number;
  status: EventSyncStatus;
  calendar_link: string | null;
  meeting_link: string | null;
  last_error: string | null;
  synced_at: string | null;
  updated_at: string | null;
}

export interface EventMemberSyncOverview {
  user_id: number;
  name: string;
  email: string;
  image: string | null;
  status: EventSyncStatus;
  is_connected: boolean;
  is_organizer: boolean;
  calendar_link: string | null;
  meeting_link: string | null;
  last_error: string | null;
  synced_at: string | null;
  updated_at: string | null;
}

export interface EventGoogleSyncOverview {
  enabled: boolean;
  counts: {
    total_assigned: number;
    pending_connection: number;
    pending: number;
    processing: number;
    synced: number;
    failed: number;
  };
  organizer: EventOrganizerSync | null;
  members: EventMemberSyncOverview[];
}

export interface EventMicrosoftSyncOverview {
  enabled: boolean;
  counts?: {
    total_assigned: number;
    pending_connection: number;
    pending: number;
    processing: number;
    synced: number;
    failed: number;
  };
  organizer?: EventOrganizerSync | null;
  members?: EventMemberSyncOverview[];
  status: EventSyncStatus;
  calendar_link: string | null;
  meeting_link: string | null;
  last_error: string | null;
  synced_at: string | null;
  updated_at: string | null;
}

export interface EventSyncOverview {
  google: EventGoogleSyncOverview;
  microsoft: EventMicrosoftSyncOverview;
}

export interface EventAssignUser {
  user: {
    id: number;
    name: string;
    image: string | null;
    email: string;
  };
}

export interface EventCreatedBy {
  id: number;
  name: string;
  image: string | null;
  email: string;
}

export interface IEvent {
  id: number;
  name: string;
  note: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
  meeting_provider: EventConferenceProvider;
  sync_targets: EventSyncTarget[];
  company_id: number;
  created_by: number;
  createdBy: EventCreatedBy;
  eventAssigns: EventAssignUser[];
  eventExternalSyncs?: any[];
  eventUserIntegrationSyncs?: any[];
  sync_overview: EventSyncOverview;
}

export interface CreateEventPayload {
  name: string;
  note: string;
  start_time: string;
  end_time: string;
  member_ids: number[] | "all";
  conference_provider?: "google" | "microsoft";
  calendar_sync_targets?: EventSyncTarget[];
  force_create?: boolean;
}

/* =========================
 * Google Integration
 * ========================= */
export type GoogleConnectionStatus =
  | "connected"
  | "disconnected"
  | "expired"
  | "revoked";

export interface GoogleConnectedResponse {
  connected: boolean;
  provider: "google";
  status: GoogleConnectionStatus;
  provider_email: string | null;
  token_expiry: string | null;
  last_synced_at: string | null;
}

export interface GoogleStatusFullResponse {
  id?: number;
  provider: "google";
  type: "calendar";
  status: GoogleConnectionStatus;
  connected: boolean;
  provider_email?: string | null;
  user?: { id: number; name: string; email: string; company_id: number };
  token_expiry?: string | null;
  scope?: string[];
  metadata?: { profile_picture: string | null; calendar_id: string };
  last_synced_at?: string | null;
  disconnected_at?: string | null;
}

export interface GoogleCalendarMetadata {
  id: string;
  summary: string;
  description: string | null;
  primary: boolean;
  backgroundColor: string | null;
  foregroundColor: string | null;
  accessRole: string | null;
}

export interface GoogleEventsListItem {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: string;
  }[];
  organizer?: { email?: string; displayName?: string };
  status?: string;
  provider: "google";
  calendar: GoogleCalendarMetadata;
}

/* =========================
 * Microsoft Integration
 * ========================= */
export type MicrosoftConnectionStatus =
  | "connected"
  | "disconnected"
  | "expired"
  | "revoked";

export interface MicrosoftConnectedResponse {
  connected: boolean;
  provider: "microsoft";
  status: MicrosoftConnectionStatus;
  provider_email: string | null;
  token_expiry: string | null;
  last_synced_at: string | null;
}

export interface MicrosoftStatusFullResponse {
  id?: number;
  provider: "microsoft";
  type: "calendar";
  status: MicrosoftConnectionStatus;
  connected: boolean;
  provider_email?: string | null;
  user?: { id: number; name: string; email: string };
  token_expiry?: string | null;
  scope?: string[];
  metadata?: {
    display_name?: string;
    user_principal_name?: string;
    tenant_id?: string;
  };
  last_synced_at?: string | null;
  disconnected_at?: string | null;
}

export interface MicrosoftEventsListItem {
  id?: string;
  subject?: string;
  bodyPreview?: string;
  webLink?: string;
  onlineMeetingUrl?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  attendees?: Array<{
    emailAddress?: { address?: string; name?: string };
    status?: { response?: string };
  }>;
  organizer?: { emailAddress?: { address?: string; name?: string } };
  isOnlineMeeting?: boolean;
  provider?: "microsoft";
}