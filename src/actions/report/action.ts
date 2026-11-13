"use server";

import { baseApi } from "../baseApi";
import {
  IDailyReportResponse,
  IResponse,
  ITimeSheetEntry,
  IUserWorkReport,
} from "@/types/type";

export const getTimeEntry = async (
  query = {},
): Promise<IResponse<ITimeSheetEntry[]>> => {
  return await baseApi("/time-entries", {
    query,
    tag: "manualTimeEntry",
  });
};

// A successful delete revalidates its tag, and that alone makes the action
// answer with a fresh render of the current route — every read is live, so
// no other tag has to be named for the timesheet to drop the entry.
export const deleteTimeEntry = async (id: number): Promise<IResponse<null>> => {
  return await baseApi(`/time-entries/remove-manual-time/${id}`, {
    method: "DELETE",
    tag: "timeEntry",
  });
};

export const getDateBaseTimeEntry = async (
  query = {},
): Promise<IResponse<IDailyReportResponse>> => {
  return await baseApi("/activities/duration", {
    query,
    tag: "timeEntry",
  });
};

export const getAttendance = async (
  query = {},
): Promise<IResponse<ITimeSheetEntry[]>> => {
  return await baseApi("/check-in-out", {
    query,
    tag: "attendance",
  });
};

export const getWorkReport = async (
  query = {},
): Promise<IResponse<IUserWorkReport>> => {
  return await baseApi("/check-in-out/monthly-report", {
    query,
    tag: "schedules", // this is related to schedule because it is used in schedule report page
  });
};
