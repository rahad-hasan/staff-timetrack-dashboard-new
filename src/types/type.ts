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
  id: number | undefined
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
  status: ProjectStatus;
  description: string | null;
  start_date: string;
  deadline: string | null;
  is_idle_time: boolean;
  budget: number | null;
  client: null;
  projectAssigns: ProjectAssign[];
  projectManagerAssigns: ProjectManagerAssign[];
  summary: ProjectSummary;
}

export interface ICreateProjectPayload {
  name: string;
  client_id: number | string;
  manager_ids: number[] | string[];
  user_ids: number[];
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
  status: 'pending' | 'processing' | 'complete' | 'cancelled';
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

export type ISearchParams = Promise<{ [key: string]: string | string[] | number | undefined }>;

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
  status: 'pending' | 'processing' | 'complete' | 'cancelled';
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
}

export interface IManualTimeEntry {
  id: number;
  start_time: string;
  end_time: string;
  duration: number;
  status: 'pending' | 'processing' | 'complete' | 'cancelled';
  user_id: number;
  project_id: number;
  task_id: number;
  system_update: string;
  notes: string | null;
  created_at: string;
  user: User;
  project: Project;
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