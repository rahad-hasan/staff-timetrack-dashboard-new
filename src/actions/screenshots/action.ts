"use server";

import { revalidateTag } from "next/cache";
import { baseApi } from "../baseApi";
import { INotes, IResponse } from "@/types/type";

// Screenshot URLs are signed and expire. When the client sees dead image
// tokens it calls this: revalidating inside a server action makes Next answer
// the action with a fresh render of the current route, and because every
// screenshot read is live that render carries freshly signed URLs. No cache
// entry is involved — the tags only trigger that render.
export const refreshScreenshotUrls = async () => {
  revalidateTag("screenshots");
};

// The day as hours of 10-minute slots, each with its screenshots. Both views
// of the screenshots page are drawn from this one read (see
// ScreenshotsDayServer); there is no separate read for "All Screenshots".
export const getScreenshots10Min = async (query = {}) => {
  return await baseApi("/activities", {
    query,
    tag: "screenshots",
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
