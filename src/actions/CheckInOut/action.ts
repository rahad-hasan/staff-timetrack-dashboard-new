"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import {
  IResponse,
  ITimeSheetEntry,
  IUserWorkReport,
} from "@/types/type";
import { API_TAGS } from "@/constants/api.constants";

export const getAttendance = async (
  query = {},
): Promise<IResponse<ITimeSheetEntry[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(`/check-in-out${queryString ? `?${queryString}` : ""}`, {
    tag: API_TAGS.ATTENDANCE,
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
      tag: API_TAGS.SCHEDULES, // this is related to schedule because it is used in schedule report page
    },
  );
};
