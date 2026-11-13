"use server";
import { baseApi } from "../baseApi";
import type { QueryParams } from "@/utils/buildQuery";
import { IMonthlyWorkReport, IResponse } from "@/types/type";

export const getMonthlyWorkReport = async (
  query: QueryParams = {},
): Promise<IResponse<IMonthlyWorkReport>> => {
  return await baseApi(`/activities/monthly-report`, {
    query,
    tag: "monthly-report",
  });
};
