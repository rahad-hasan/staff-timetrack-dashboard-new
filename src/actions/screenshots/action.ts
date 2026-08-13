"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IAllScreenshot, IResponse } from "@/types/type";
import { API_TAGS } from "@/constants/api.constants";

export const getScreenshots10Min = async (query = {}) => {
  const queryString = buildQuery(query);
  return await baseApi(`/activities${queryString ? `?${queryString}` : ""}`, {
    tag: API_TAGS.SCREENSHOTS,
  });
};

export const getAllScreenshots = async (
  query = {},
): Promise<IResponse<IAllScreenshot[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/activities/all-screenshots${queryString ? `?${queryString}` : ""}`,
    {
      tag: "allScreenshots",
      revalidate: 30,
    },
  );
};

export const deleteScreenshot = async ({
  data,
}: {
  data: {
    user_id: number;
    from_time: string;
    to_time: string;
    duration: number;
  };
}) => {
  return await baseApi(`/screenshots`, {
    method: "DELETE",
    body: data,
    tag: API_TAGS.SCREENSHOTS,
    cache: "no-cache",
  });
};
