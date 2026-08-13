"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { popularTimeZoneList } from "@/utils/TimeZoneList";
import { API_TAGS } from "@/constants/api.constants";

export const getDashboardStats = async (query = {}) => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/dashboard/stats${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.dashboardSTATS,
    },
  );
};

export const getCoreMembers = async (query = {}) => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/admin/core-member${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.coreMEMBER,
    },
  );
};

export const getDashboardMembersStats = async (query = {}) => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/admin/members/activity-report${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.memberSTATS,
    },
  );
};

// export const getDashboardAppsUrls = async (query = {}) => {
//   const queryString = buildQuery(query);
//   return await baseApi(
//     `/admin/recent-app-url${queryString ? `?${queryString}` : ""}`,
//     {
//       tag: "recentAppUrl",
//     },
//   );
// };

export const getTodayWorkTime = async () => {
  return await baseApi(`/dashboard/work-time`, {
    tag: API_TAGS.todayWorkTIME,
    cache: "no-cache",
  });
};

export const getTimezones = async () => {
  const res = await baseApi("/dashboard/timezone-list", {
  });
  return {
    data: res?.data?.data
      ? popularTimeZoneList.filter((item) =>
          res?.data?.data.includes(item.value),
        )
      : [],
    defaultValue: res?.data?.user_time,
  };
};

export const getDashboardInsights = async (query = {}) => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/dashboard/insights${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.insightsDASHBOARD,
    },
  );
};
