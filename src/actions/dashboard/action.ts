"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";

export const getDashboardStats = async (query = {}) => {
    const queryString = buildQuery(query);
    return await baseApi(`/admin/stats${queryString ? `?${queryString}` : ""}`, {
        tag: "dashboardStats",
    });
};

export const getCoreMembers = async (query = {}) => {
    const queryString = buildQuery(query);
    return await baseApi(`/admin/core-member${queryString ? `?${queryString}` : ""}`, {
        tag: "coreMember",
    });
};

export const getDashboardMembersStats = async (query = {}) => {
    const queryString = buildQuery(query);
    return await baseApi(`/admin/members/activity-report${queryString ? `?${queryString}` : ""}`, {
        tag: "memberStats",
    });
};

export const getDashboardAppsUrls = async (query = {}) => {
    const queryString = buildQuery(query);
    return await baseApi(`/admin/recent-app-url${queryString ? `?${queryString}` : ""}`, {
        tag: "recentAppUrl",
    });
};