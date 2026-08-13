"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IApp, IResponse, IUrl } from "@/types/type";
import { API_TAGS } from "@/constants/api.constants";

export const getApps = async (
  query = {},
): Promise<IResponse<{ apps: IApp[] }>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/apps-url/apps${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.APPS,
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
      tag: API_TAGS.URLS,
    },
  );
};

export const getDashboardAppsAndUrls = async (query = {}) => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/admin/recent-app-url${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.appUrlDASHBOARD,
    },
  );
};