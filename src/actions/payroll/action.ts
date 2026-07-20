"use server";

import { revalidateTag } from "next/cache";
import { baseApi } from "../baseApi";
import { buildQuery } from "@/utils/buildQuery";
import { IResponse } from "@/types/type";
import {
  CreatePayrollProfilePayload,
  EligibleUser,
  EligibleUsersParams,
  EmployeePayroll,
  EmployeePayrollProfile,
  GeneratePayrollPayload,
  GeneratePayrollResult,
  ListProfilesParams,
  ListRunsParams,
  PayrollHistoryParams,
  PayrollRun,
  PayrollRunDetail,
  PayrollSummary,
  RunDetailParams,
  UpdatePayrollProfilePayload,
} from "@/types/payroll";

const PROFILES_TAG = "payroll-profiles";
const SUMMARY_TAG = "payroll-summary";
const ELIGIBLE_USERS_TAG = "payroll-eligible-users";
const RUNS_TAG = "payroll-runs";
const HISTORY_TAG = "payroll-history";
const runTag = (id: number | string) => `payroll-run-${id}`;
const userProfileTag = (id: number | string) => `payroll-profile-user-${id}`;

const invalidateProfileCaches = (userId?: number) => {
  revalidateTag(PROFILES_TAG);
  revalidateTag(SUMMARY_TAG);
  revalidateTag(ELIGIBLE_USERS_TAG);
  if (userId != null) {
    revalidateTag(userProfileTag(userId));
  }
};

const invalidateRunCaches = (runId?: number) => {
  revalidateTag(RUNS_TAG);
  if (runId != null) {
    revalidateTag(runTag(runId));
  }
};

/* ---------------- Profiles ---------------- */

export const createPayrollProfile = async (
  payload: CreatePayrollProfilePayload,
): Promise<IResponse<EmployeePayrollProfile>> => {
  const response = await baseApi<IResponse<EmployeePayrollProfile>>(
    `/payroll/profile`,
    {
      method: "POST",
      body: payload,
      cache: "no-cache",
    },
  );

  if (response?.success) {
    invalidateProfileCaches(payload.user_id);
  }

  return response;
};

export const listPayrollProfiles = async (
  query: ListProfilesParams = {},
): Promise<IResponse<EmployeePayrollProfile[]>> => {
  const queryString = buildQuery(
    query as Record<string, string | number | boolean | undefined>,
  );
  return await baseApi<IResponse<EmployeePayrollProfile[]>>(
    `/payroll/profile${queryString ? `?${queryString}` : ""}`,
    {
      tag: PROFILES_TAG,
      cache: "no-cache",
    },
  );
};

export const getPayrollSummary = async (): Promise<
  IResponse<PayrollSummary>
> => {
  return await baseApi<IResponse<PayrollSummary>>(`/payroll/summary`, {
    tag: SUMMARY_TAG,
    cache: "no-cache",
  });
};

export const listEligibleUsers = async (
  query: EligibleUsersParams = {},
): Promise<IResponse<EligibleUser[]>> => {
  const queryString = buildQuery(
    query as Record<string, string | number | boolean | undefined>,
  );
  return await baseApi<IResponse<EligibleUser[]>>(
    `/payroll/eligible-users${queryString ? `?${queryString}` : ""}`,
    {
      tag: ELIGIBLE_USERS_TAG,
      cache: "no-cache",
    },
  );
};

export const getPayrollProfileForUser = async (
  userId: number,
): Promise<IResponse<EmployeePayrollProfile[]>> => {
  return await baseApi<IResponse<EmployeePayrollProfile[]>>(
    `/payroll/profile/${userId}`,
    {
      tag: userProfileTag(userId),
      cache: "no-cache",
    },
  );
};

export const updatePayrollProfile = async (
  id: number,
  payload: UpdatePayrollProfilePayload,
  userId?: number,
): Promise<IResponse<EmployeePayrollProfile>> => {
  const response = await baseApi<IResponse<EmployeePayrollProfile>>(
    `/payroll/profile/${id}`,
    {
      method: "PUT",
      body: payload,
      cache: "no-cache",
    },
  );

  if (response?.success) {
    invalidateProfileCaches(userId);
  }

  return response;
};

/* ---------------- Runs ---------------- */

export const generatePayroll = async (
  payload: GeneratePayrollPayload,
): Promise<IResponse<GeneratePayrollResult>> => {
  const response = await baseApi<IResponse<GeneratePayrollResult>>(
    `/payroll/generate`,
    {
      method: "POST",
      body: payload,
      cache: "no-cache",
    },
  );

  if (response?.success) {
    invalidateRunCaches(response.data?.payroll_run_id);
  }

  return response;
};

export const listPayrollRuns = async (
  query: ListRunsParams = {},
): Promise<IResponse<PayrollRun[]>> => {
  const queryString = buildQuery(
    query as Record<string, string | number | undefined>,
  );
  return await baseApi<IResponse<PayrollRun[]>>(
    `/payroll/runs${queryString ? `?${queryString}` : ""}`,
    {
      tag: RUNS_TAG,
      cache: "no-cache",
    },
  );
};

export const getPayrollRun = async (
  id: number | string,
  query: RunDetailParams = {},
): Promise<IResponse<PayrollRunDetail>> => {
  const queryString = buildQuery(
    query as Record<string, string | number | undefined>,
  );
  return await baseApi<IResponse<PayrollRunDetail>>(
    `/payroll/run/${id}${queryString ? `?${queryString}` : ""}`,
    {
      tag: runTag(id),
      cache: "no-cache",
    },
  );
};

export const approvePayrollRun = async (
  id: number,
  payload: { notes?: string } = {},
): Promise<IResponse<PayrollRun>> => {
  const response = await baseApi<IResponse<PayrollRun>>(
    `/payroll/run/${id}/approve`,
    {
      method: "PATCH",
      body: payload,
      cache: "no-cache",
    },
  );

  if (response?.success) {
    invalidateRunCaches(id);
  }

  return response;
};

/* ---------------- Employee history ---------------- */

export const getMyPayrollHistory = async (
  query: PayrollHistoryParams = {},
): Promise<IResponse<EmployeePayroll[]>> => {
  const queryString = buildQuery(
    query as Record<string, string | number | undefined>,
  );
  return await baseApi<IResponse<EmployeePayroll[]>>(
    `/payroll/history${queryString ? `?${queryString}` : ""}`,
    {
      tag: HISTORY_TAG,
      cache: "no-cache",
    },
  );
};

