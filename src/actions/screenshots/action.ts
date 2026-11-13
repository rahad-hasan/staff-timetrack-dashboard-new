"use server";

import { revalidateTag } from "next/cache";
import { baseApi } from "../baseApi";
import { IAllScreenshot, INotes, IResponse } from "@/types/type";

// Screenshot URLs are signed and expire. When the client sees dead image
// tokens it calls this: revalidating inside a server action makes Next answer
// the action with a fresh render of the current route, and because every
// screenshot read is live that render carries freshly signed URLs. No cache
// entry is involved — the tags only trigger that render.
export const refreshScreenshotUrls = async () => {
  revalidateTag("screenshots");
  revalidateTag("allScreenshots");
};

export const getScreenshots10Min = async (query = {}) => {
  return await baseApi("/activities", {
    query,
    tag: "screenshots",
  });
};

export const getAllScreenshots = async (
  query = {},
): Promise<IResponse<IAllScreenshot[]>> => {
  return await baseApi("/activities/all-screenshots", {
    query,
    tag: "allScreenshots",
  });
};

export const getNotes = async (query = {}): Promise<IResponse<INotes[]>> => {
  return await baseApi("/activities/notes", {
    query,
    tag: "screenshots",
  });
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
  });
};
