"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";

export const getAppsUrls = async (query = {}) => {
    const queryString = buildQuery(query);
    return await baseApi(`/apps-url${queryString ? `?${queryString}` : ""}`, {
        tag: "appsUrls",
    });
};
