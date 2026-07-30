"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import {
  IResponse,
  ITimeSheetEntry,
  IUserWorkReport,
} from "@/types/type";

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
