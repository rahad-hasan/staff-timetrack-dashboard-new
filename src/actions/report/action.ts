"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import {
  IDailyReportResponse,
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
