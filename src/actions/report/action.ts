"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import {
  IDailyReportResponse,
  IMonthlyWorkReport,
  INotes,
  IResponse,
} from "@/types/type";

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

export const getMonthlyWorkReport = async (
  query = {},
): Promise<IResponse<IMonthlyWorkReport>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/activities/monthly-report${queryString ? `?${queryString}` : ""}`,
    {
      tag: "monthly-report",
    },
  );
};

export const getNotes = async (query = {}): Promise<IResponse<INotes[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/activities/notes${queryString ? `?${queryString}` : ""}`,
    {
      tag: "screenshots",
    },
  );
};
