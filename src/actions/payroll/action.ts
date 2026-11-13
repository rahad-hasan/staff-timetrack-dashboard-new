"use server";

import { revalidateTag } from "next/cache";
import { baseApi } from "../baseApi";
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
  SaveAdjustmentsPayload,
  SaveAdjustmentsResult,
  SupersedePayrollProfilePayload,
  SupersedePayrollProfileResult,
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
  // Payslip history reads from HISTORY_TAG and nothing revalidated it, so
  // employee payslips went stale after every run mutation. Adjustments must
  // surface there, so the tag is refreshed alongside the run.
  revalidateTag(HISTORY_TAG);
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
  return await baseApi<IResponse<EmployeePayrollProfile[]>>(
    `/payroll/profile`,
    {
      query: { ...query },
      tag: PROFILES_TAG,
    },
  );
};

export const getPayrollSummary = async (): Promise<
  IResponse<PayrollSummary>
> => {
  return await baseApi<IResponse<PayrollSummary>>(`/payroll/summary`, {
    tag: SUMMARY_TAG,
  });
};

export const listEligibleUsers = async (
  query: EligibleUsersParams = {},
): Promise<IResponse<EligibleUser[]>> => {
  return await baseApi<IResponse<EligibleUser[]>>(
    `/payroll/eligible-users`,
    {
      query: { ...query },
      tag: ELIGIBLE_USERS_TAG,
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
    },
  );

  if (response?.success) {
    invalidateProfileCaches(userId);
  }

  return response;
};

/**
 * A salary raise in ONE backend transaction: profile `id` ends the day before
 * `payload.effective_from` and the successor starts on it — both or neither,
 * so a failure can never leave the employee without a profile.
 */
export const supersedePayrollProfile = async (
  id: number,
  payload: SupersedePayrollProfilePayload,
): Promise<IResponse<SupersedePayrollProfileResult>> => {
  const response = await baseApi<IResponse<SupersedePayrollProfileResult>>(
    `/payroll/profile/${id}/supersede`,
    {
      method: "POST",
      body: payload,
    },
  );

  if (response?.success) {
    invalidateProfileCaches(response.data?.successor?.user_id);
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
  return await baseApi<IResponse<PayrollRun[]>>(
    `/payroll/runs`,
    {
      query: { ...query },
      tag: RUNS_TAG,
    },
  );
};

export const getPayrollRun = async (
  id: number | string,
  query: RunDetailParams = {},
): Promise<IResponse<PayrollRunDetail>> => {
  return await baseApi<IResponse<PayrollRunDetail>>(
    `/payroll/run/${id}`,
    {
      query: { ...query },
      tag: runTag(id),
    },
  );
};

/** The API's largest page for a run's employee rows. */
const RUN_EXPORT_PAGE_SIZE = 500;

/**
 * Every employee row of a run, for a document that must contain all of them
 * (the PDF export).
 *
 * The pages are read here, in parallel, in one server action — a browser
 * running one action per page would have them queued one at a time. Any page
 * that fails fails the whole read: an export missing employees must never look
 * like a finished one.
 */
export const getPayrollRunForExport = async (
  id: number,
): Promise<IResponse<PayrollRunDetail>> => {
  const first = await getPayrollRun(id, { page: 1, limit: RUN_EXPORT_PAGE_SIZE });
  if (!first?.success || !first.data) return first;

  const firstItems = first.data.items ?? [];
  const total = first.meta?.total ?? firstItems.length;
  const pageCount = Math.max(1, Math.ceil(total / RUN_EXPORT_PAGE_SIZE));

  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      getPayrollRun(id, { page: index + 2, limit: RUN_EXPORT_PAGE_SIZE }),
    ),
  );
  const failed = rest.find((page) => !page?.success || !page.data);
  if (failed) {
    return {
      ...failed,
      success: false,
      message:
        failed.message ||
        "Some employees of this run could not be loaded. Please try again.",
    };
  }

  const items = [
    ...firstItems,
    ...rest.flatMap((page) => page.data.items ?? []),
  ];
  // The pages only disagree with the first page's total if the run was
  // regenerated between the reads — the rows would then mix two runs.
  if (items.length !== total) {
    return {
      ...first,
      success: false,
      message: "This payroll run changed while it was being exported. Please try again.",
    };
  }

  return { ...first, data: { run: first.data.run, items } };
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
    },
  );

  if (response?.success) {
    invalidateRunCaches(id);
  }

  return response;
};

/* ---------------- Manual adjustments ---------------- */

/** next/navigation's redirect() signals by throwing — never swallow it. */
const isNextRedirectError = (error: unknown): boolean => {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
};

/**
 * REPLACE the full adjustment set for one employee on one run. The body is the
 * complete set to persist — not a patch — so both keys are always sent.
 */
export const savePayrollAdjustments = async (
  runId: number,
  userId: number,
  payload: SaveAdjustmentsPayload,
): Promise<IResponse<SaveAdjustmentsResult>> => {
  let response: IResponse<SaveAdjustmentsResult>;

  try {
    response = await baseApi<IResponse<SaveAdjustmentsResult>>(
      `/payroll/run/${runId}/employee/${userId}/adjustments`,
      {
        method: "PUT",
        body: {
          waive_deduction: payload.waive_deduction,
          bonuses: payload.bonuses.map((bonus) => ({
            title: bonus.title.trim(),
            amount: bonus.amount,
          })),
        },
      },
    );
  } catch (error) {
    // baseApi answers API failures with an envelope; anything that still
    // throws reaches the dialog as one too. A session expiry redirect throws
    // through the same path and must survive.
    if (isNextRedirectError(error)) throw error;
    return {
      statusCode: 0,
      success: false,
      message: "Couldn't reach the payroll service. Please try again.",
    } as IResponse<SaveAdjustmentsResult>;
  }

  if (response?.success) {
    invalidateRunCaches(runId);
  }

  return response;
};

/* ---------------- Employee history ---------------- */

export const getMyPayrollHistory = async (
  query: PayrollHistoryParams = {},
): Promise<IResponse<EmployeePayroll[]>> => {
  return await baseApi<IResponse<EmployeePayroll[]>>(
    `/payroll/history`,
    {
      query: { ...query },
      tag: HISTORY_TAG,
    },
  );
};

