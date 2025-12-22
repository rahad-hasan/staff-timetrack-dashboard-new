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