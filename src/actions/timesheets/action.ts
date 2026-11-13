/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { baseApi } from "../baseApi";
import {
  AddTimeEntryPayload,
  IDailyTimeTrackerData,
  IManualTimeEntry,
  IResponse,
} from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";

export const getManualTimeEntry = async (
  query = {},
): Promise<IResponse<IManualTimeEntry[]>> => {
  return await baseApi("/time-entries/manual-time-entry", {
    query,
    tag: "manualTimeEntry",
  });
};

export const addManualTimeEntry = async (data: {
  project_id: number;
  task_id?: number;
  start_time: string;
  end_time: string;
  note?: string;
}) => {
  return await baseApi(`/time-entries/manual-time-entry`, {
    method: "POST",
    body: data,
    tag: "manualTimeEntry",
  });
};

export const approveRejectManualTimeEntry = async ({
  data,
  id,
}: {
  data: {
    is_approved: boolean;
  };
  id: number | undefined;
}) => {
  return await baseApi(`/time-entries/approved/${id}`, {
    method: "PATCH",
    body: data,
    tag: "manualTimeEntry",
  });
};

export const getDailyTimeEntry = async (
  query = {},
): Promise<IResponse<IDailyTimeTrackerData[]>> => {
  return await baseApi("/time-entries/daily-time-sheet", {
    query,
    tag: "manualTimeEntry",
  });
};

export const getWeeklyAndMonthlyTimeEntry = async (
  query = {},
): Promise<IResponse<any>> => {
  return await baseApi("/time-entries/weekly-time-sheet", {
    query,
    tag: "manualTimeEntry",
  });
};

export const addTimeEntry = async (
  data: AddTimeEntryPayload,
): Promise<IResponse<unknown>> => {
  const currentUser = await getDecodedUser();

  if (currentUser?.role !== "admin") {
    return {
      statusCode: 403,
      data: null,
      message: "Only admin can add time directly.",
      success: false,
    };
  }

  return await baseApi(`/time-entries/add-time`, {
    method: "POST",
    body: data,
    tag: "manualTimeEntry",
  });
};
