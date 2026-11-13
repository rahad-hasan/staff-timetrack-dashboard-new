"use server";

import { baseApi } from "../baseApi";
import { IApp, IResponse, IUrl } from "@/types/type";

export const getApps = async (
  query = {},
): Promise<IResponse<{ apps: IApp[] }>> => {
  return await baseApi("/apps-url/apps", {
    query,
    tag: "apps",
  });
};

export const getUrls = async (
  query = {},
): Promise<IResponse<{ urls: IUrl[] }>> => {
  return await baseApi("/apps-url/urls", {
    query,
    tag: "urls",
  });
};
