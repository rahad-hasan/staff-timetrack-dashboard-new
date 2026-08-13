"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import {
  IDailyReportResponse,
  IMonthlyWorkReport,
  INotes,
  IResponse,
} from "@/types/type";
import { API_TAGS } from "@/constants/api.constants";

export const getDateBaseTimeEntry = async (
  query = {},
): Promise<IResponse<IDailyReportResponse>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/activities/duration${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.timeENTRY,
    },
  );
};

export const getMonthlyWorkReport = async (
  query = {},
): Promise<IResponse<IMonthlyWorkReport>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/activities/monthly-report${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.monthlyREPORT,
    },
  );
};

export const getNotes = async (query = {}): Promise<IResponse<INotes[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/activities/notes${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.SCREENSHOTS,
    },
  );
};
