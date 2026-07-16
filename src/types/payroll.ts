export type PayrollSalaryType = "monthly_fixed" | "hourly";
export type PayrollRunStatus = "draft" | "generated" | "approved" | "paid";

export const PAYROLL_SALARY_TYPES: PayrollSalaryType[] = [
  "monthly_fixed",
  "hourly",
];

export const PAYROLL_RUN_STATUSES: PayrollRunStatus[] = [
  "draft",
  "generated",
  "approved",
  "paid",
];

export const SALARY_TYPE_LABELS: Record<PayrollSalaryType, string> = {
  monthly_fixed: "Monthly Fixed",
  hourly: "Hourly",
};

export const RUN_STATUS_LABELS: Record<PayrollRunStatus, string> = {
  draft: "Draft",
  generated: "Generated",
  approved: "Approved",
  paid: "Paid",
};

export const RUN_STATUS_BADGE_CLASSES: Record<PayrollRunStatus, string> = {
  draft:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700",
  generated:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  approved:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  paid: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
};

export interface PayrollUserSummary {
  id: number;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

export interface EmployeePayrollProfile {
  id: number;
  company_id: number;
  user_id: number;
  salary_type: PayrollSalaryType;
  monthly_salary: number;
  hourly_rate: number;
  overtime_allow: boolean;
  overtime_multiplier: number;
  is_deduct_salary: boolean;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  user?: PayrollUserSummary;
  has_schedule: boolean;
}

export interface PayrollRun {
  id: number;
  company_id: number;
  month: number;
  year: number;
  period_start: string;
  period_end: string;
  status: PayrollRunStatus;
  currency: string;
  total_employees: number;
  generated_count: number;
  failed_count: number;
  total_gross: number;
  total_net: number;
  generated_by: number | null;
  approved_by: number | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  generatedBy?: { id: number; name: string; email: string } | null;
  approvedBy?: { id: number; name: string; email: string } | null;
}

export interface EmployeePayroll {
  id: number;
  payroll_run_id: number;
  company_id: number;
  user_id: number;
  profile_id: number | null;
  salary_type: PayrollSalaryType;
  currency: string;

  target_hours: number;
  worked_hours: number;
  leave_hours: number;
  holiday_hours: number;
  overtime_hours: number;
  payable_hours: number;

  basic_salary: number;
  hourly_rate: number;
  overtime_multiplier: number;

  deduction_amount: number;
  overtime_amount: number;
  gross_salary: number;
  final_salary: number;

  calculation_snapshot: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;

  user?: PayrollUserSummary;
  payrollRun?: Pick<
    PayrollRun,
    | "id"
    | "month"
    | "year"
    | "status"
    | "period_start"
    | "period_end"
    | "approved_at"
    | "paid_at"
  >;
}

export interface CreatePayrollProfilePayload {
  user_id: number;
  salary_type: PayrollSalaryType;
  monthly_salary: number;
  hourly_rate: number;
  overtime_allow: boolean;
  overtime_multiplier: number;
  is_deduct_salary: boolean;
  effective_from: string;
  effective_to: string | null;
  currency: string;
}

export interface UpdatePayrollProfilePayload {
  salary_type?: PayrollSalaryType;
  monthly_salary?: number;
  hourly_rate?: number;
  overtime_allow?: boolean;
  overtime_multiplier?: number;
  is_deduct_salary?: boolean;
  effective_from?: string;
  effective_to?: string | null;
  currency?: string;
  is_active?: boolean;
}

export interface GeneratePayrollPayload {
  month: number;
  year: number;
  notes?: string;
  force?: boolean;
}

export interface GeneratePayrollResult {
  payroll_run_id: number;
  month: number;
  year: number;
  status: PayrollRunStatus;
  total_employee: number;
  generated: number;
  failed: number;
  skipped: Array<{ user_id: number; reason: string }>;
}

export interface PayrollRunDetail {
  run: PayrollRun;
  items: EmployeePayroll[];
}

export interface ListProfilesParams {
  user_id?: number;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface ListRunsParams {
  year?: number;
  month?: number;
  status?: PayrollRunStatus;
  page?: number;
  limit?: number;
}

export interface RunDetailParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PayrollHistoryParams {
  user_id?: number;
  year?: number;
  page?: number;
  limit?: number;
}
