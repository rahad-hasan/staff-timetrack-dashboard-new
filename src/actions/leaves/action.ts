"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import {
  CreateLeaveTypePayload,
  AdminLeaveHistoryFilters,
  ILeaveDetailsResponse,
  ILeaveRequest,
  IResponse,
  LeaveHolidayListData,
  LeaveRecord,
  LeaveTypeListFilters,
  LeaveTypeRecord,
  UpdateLeaveTypePayload,
  UserLeaveSummary,
} from "@/types/type";
import { revalidateTag } from "next/cache";

export const getLeave = async (
  query = {},
): Promise<IResponse<ILeaveRequest[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(`/leaves${queryString ? `?${queryString}` : ""}`, {
    tag: "leaves",
  });
};

export const getLeaveDetails = async (
  query = {},
): Promise<IResponse<ILeaveDetailsResponse>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/leaves/details${queryString ? `?${queryString}` : ""}`,
    {
      tag: "leaves",
    },
  );
};

export const getUserLeaveSummary = async (
  query = {},
): Promise<IResponse<UserLeaveSummary>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/leaves/details/user${queryString ? `?${queryString}` : ""}`,
    {
      tag: "leaves",
    },
  );
};

export const getLeaveHistory = async (
  query: AdminLeaveHistoryFilters = {},
): Promise<IResponse<LeaveRecord[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/leaves/history${queryString ? `?${queryString}` : ""}`,
    {
      tag: "leaves",
    },
  );
};

export const getLeaveHolidays = async (
  query: { year?: string | number } = {},
): Promise<IResponse<LeaveHolidayListData>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/leaves/holidays${queryString ? `?${queryString}` : ""}`,
    {
      tag: "leave-holidays",
    },
  );
};

export const addLeave = async (data: {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason: string;
}): Promise<IResponse<LeaveRecord>> => {
  const response = await baseApi(`/leaves`, {
    method: "POST",
    body: data,
    tag: "leaves",
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateTag("leaves");
    revalidateTag("leave-types");
  }

  return response;
};

export const getLeaveTypes = async (
  query: LeaveTypeListFilters = {},
): Promise<IResponse<LeaveTypeRecord[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/leaves/types${queryString ? `?${queryString}` : ""}`,
    {
      tag: "leave-types",
    },
  );
};

export const getLeaveType = async (
  id: number,
): Promise<IResponse<LeaveTypeRecord>> => {
  return await baseApi(`/leaves/types/${id}`, {
    tag: "leave-types",
  });
};

export const createLeaveType = async (
  data: CreateLeaveTypePayload,
): Promise<IResponse<LeaveTypeRecord>> => {
  const response = await baseApi(`/leaves/types`, {
    method: "POST",
    body: data,
    tag: "leave-types",
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateTag("leave-types");
    revalidateTag("leaves");
  }

  return response;
};

export const updateLeaveType = async (
  id: number,
  data: UpdateLeaveTypePayload,
): Promise<IResponse<LeaveTypeRecord>> => {
  const response = await baseApi(`/leaves/types/${id}`, {
    method: "PATCH",
    body: data,
    tag: "leave-types",
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateTag("leave-types");
    revalidateTag("leaves");
  }

  return response;
};

export const deleteLeaveType = async (
  id: number,
): Promise<IResponse<null>> => {
  const response = await baseApi(`/leaves/types/${id}`, {
    method: "DELETE",
    tag: "leave-types",
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateTag("leave-types");
    revalidateTag("leaves");
  }

  return response;
};

export const approveRejectLeave = async ({
  data,
}: {
  data: {
    leave_id: number;
    approved: boolean;
    reject_reason?: string;
  };
}): Promise<IResponse<LeaveRecord>> => {
  const response = await baseApi(`/leaves/update-status`, {
    method: "PATCH",
    body: data,
    tag: "leaves",
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateTag("leaves");
    revalidateTag("leave-types");
  }

  return response;
};

export const deleteLeave = async (
  id: number,
): Promise<IResponse<null>> => {
  const response = await baseApi(`/leaves/${id}`, {
    method: "DELETE",
    tag: "leaves",
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateTag("leaves");
    revalidateTag("leave-types");
  }

  return response;
};
