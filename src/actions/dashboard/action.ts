"use server";

import { baseApi } from "../baseApi";
import { popularTimeZoneList } from "@/utils/TimeZoneList";
import type { QueryParams } from "@/utils/buildQuery";
import type { IResponse } from "@/types/type";

/*
 * Every read here is live (baseApi's default) and carries no cache tag: a tag
 * only labels a Data Cache entry, and these responses are never stored. Fresh
 * numbers after a write come from the action's own re-render, not a purge.
 */

export const getDashboardStats = async (query: QueryParams = {}) =>
  await baseApi(`/dashboard/stats`, { query });

export const getCoreMembers = async (query: QueryParams = {}) =>
  await baseApi(`/admin/core-member`, { query });

export const getDashboardMembersStats = async (query: QueryParams = {}) =>
  await baseApi(`/admin/members/activity-report`, { query });

export const getDashboardInsights = async (query: QueryParams = {}) =>
  await baseApi(`/dashboard/insights`, { query });

export const getDashboardAppsAndUrls = async (query: QueryParams = {}) =>
  await baseApi(`/admin/recent-app-url`, { query });

/** The viewer's own tracked time today, as `{ duration: "HH:MM:SS" }`. */
export const getTodayWorkTime = async (): Promise<
  IResponse<{ duration: string }>
> => await baseApi(`/dashboard/work-time`);

export const getTimezones = async () => {
  const res = await baseApi("/dashboard/timezone-list");
  return {
    data: res?.data?.data
      ? popularTimeZoneList.filter((item) =>
          res?.data?.data.includes(item.value),
        )
      : [],
    defaultValue: res?.data?.user_time,
  };
};
