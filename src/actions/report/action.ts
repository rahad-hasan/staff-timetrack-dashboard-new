"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import {
  IDailyReportResponse,
  IResponse,
  ITimeSheetEntry,
  IUserWorkReport,
} from "@/types/type";
import { revalidateTag } from "next/cache";

export const getTimeEntry = async (
  query = {},
): Promise<IResponse<ITimeSheetEntry[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(`/time-entries${queryString ? `?${queryString}` : ""}`, {
    // tag: "timeEntry",
    tag: "manualTimeEntry", // this is related with manual time request accepting and rejecting, so I put the same tag as manual time entry
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
  }

  return res;
};

export const getDateBaseTimeEntry = async (
  query = {},
): Promise<IResponse<IDailyReportResponse>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/activities/duration${queryString ? `?${queryString}` : ""}`,
    {
      tag: "timeEntry",
    },
  );
};

export const getAttendance = async (
  query = {},
): Promise<IResponse<ITimeSheetEntry[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(`/check-in-out${queryString ? `?${queryString}` : ""}`, {
    tag: "attendance",
    cache: "no-cache",
  });
};

export const getWorkReport = async (
  query = {},
): Promise<IResponse<IUserWorkReport>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/check-in-out/monthly-report${queryString ? `?${queryString}` : ""}`,
    {
      tag: "schedules", // this is related to schedule because it is used in schedule report page
    },
  );
};
