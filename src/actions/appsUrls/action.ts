"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IApp, IResponse, IUrl } from "@/types/type";

export const getApps = async (
  query = {},
): Promise<IResponse<{ apps: IApp[] }>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/apps-url/apps${queryString ? `?${queryString}` : ""}`,
    {
      tag: "apps",
    },
  );
};

export const getUrls = async (
  query = {},
): Promise<IResponse<{ urls: IUrl[] }>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/apps-url/urls${queryString ? `?${queryString}` : ""}`,
    {
      tag: "urls",
    },
  );
};
