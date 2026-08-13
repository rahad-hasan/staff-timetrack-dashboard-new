"use server";

import { revalidateTag } from "next/cache";
import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IAllScreenshot, INotes, IResponse } from "@/types/type";

// Screenshot URLs are signed and expire; when the client detects dead image
// tokens it calls this so the next render re-fetches freshly signed URLs
// instead of serving the cached (expired) payload for the revalidate window.
export const refreshScreenshotUrls = async () => {
  revalidateTag("screenshots");
  revalidateTag("allScreenshots");
};

export const getScreenshots10Min = async (query = {}) => {
  const queryString = buildQuery(query);
  return await baseApi(`/activities${queryString ? `?${queryString}` : ""}`, {
    tag: "screenshots",
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

export const getNotes = async (query = {}): Promise<IResponse<INotes[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/activities/notes${queryString ? `?${queryString}` : ""}`,
    {
      tag: "screenshots",
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
    tag: "screenshots",
    cache: "no-cache",
  });
};
