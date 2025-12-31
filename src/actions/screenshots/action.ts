"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";

export const getScreenshots10Min = async (query = {}) => {
    const queryString = buildQuery(query);
    return await baseApi(`/activities${queryString ? `?${queryString}` : ""}`, {
        tag: "screenshots",
    });
};
