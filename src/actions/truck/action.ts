/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import {
  IResponse,
  ITimeSheetEntry,
} from "@/types/type";
import { revalidateTag } from "next/cache";
import {
  AddTimeEntryPayload,
  IDailyTimeTrackerData,
  IManualTimeEntry,
} from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";

export const getTimeEntry = async (
  query = {},
): Promise<IResponse<ITimeSheetEntry[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(`/time-entries${queryString ? `?${queryString}` : ""}`, {
    // tag: "timeEntry",
    tag: "manualTimeEntry",
  });
};

export const deleteTimeEntry = async (id: number): Promise<IResponse<null>> => {
  const res = await baseApi(`/time-entries/remove-manual-time/${id}`, {
    method: "DELETE",
    tag: "timeEntry",
    cache: "no-cache",
  });

  if (res?.success) {
    revalidateTag("DailyTimeEntry");
    revalidateTag("manualTimeEntry");
  }

  return res;
};

export const getManualTimeEntry = async (
  query = {},
): Promise<IResponse<IManualTimeEntry[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/time-entries/manual-time-entry${queryString ? `?${queryString}` : ""}`,
    {
      tag: "manualTimeEntry",
    },
  );
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
    cache: "no-cache",
  });
};

export const editManualTimeEntry = async ({
  data,
  id,
}: {
  data: {
    project_id: number;
    task_id?: number;
    start_time: string;
    end_time: string;
    note?: string;
  };
  id: number | undefined;
}) => {
  return await baseApi(`/time-entries/manual-time-entry/${id}`, {
    method: "PATCH",
    body: data,
    tag: "manualTimeEntry",
    cache: "no-cache",
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
    cache: "no-cache",
  });
};

export const getDailyTimeEntry = async (
  query = {},
): Promise<IResponse<IDailyTimeTrackerData[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/time-entries/daily-time-sheet${queryString ? `?${queryString}` : ""}`,
    {
      tag: "manualTimeEntry",
    },
  );
};

export const getWeeklyAndMonthlyTimeEntry = async (
  query = {},
): Promise<IResponse<any>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/time-entries/weekly-time-sheet${queryString ? `?${queryString}` : ""}`,
    {
      tag: "manualTimeEntry",
      cache: "no-store",
    },
  );
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
    cache: "no-cache",
  });
};
