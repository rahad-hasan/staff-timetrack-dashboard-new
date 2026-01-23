"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IAllScreenshot, IResponse } from "@/types/type";

export const getScreenshots10Min = async (query = {}) => {
    const queryString = buildQuery(query);
    return await baseApi(`/activities${queryString ? `?${queryString}` : ""}`, {
        tag: "screenshots",
    });
};

export const getAllScreenshots = async (query = {}): Promise<IResponse<IAllScreenshot[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/activities/all-screenshots${queryString ? `?${queryString}` : ""}`, {
        tag: "allScreenshots",
    });
};

export const deleteScreenshot = async ({ data }: {
    data: {
        user_id: number;
        from_time: string;
        to_time: string
    },
}) => {
    return await baseApi(`/screenshots`, {
        method: "DELETE",
        body: data,
        tag: "screenshots",
    });
};