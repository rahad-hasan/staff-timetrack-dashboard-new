"use server";
import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IMonthlyWorkReport, IResponse } from "@/types/type";

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

export const getDashboardInsights = async (query = {}) => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/dashboard/insights${queryString ? `?${queryString}` : ""}`,
    {
      tag: "insightsDashboard",
    },
  );
};
