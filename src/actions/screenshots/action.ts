"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IAllScreenshot, INotes, IResponse } from "@/types/type";

export const getScreenshots10Min = async (query = {}) => {
    const queryString = buildQuery(query);
    return await baseApi(`/activities${queryString ? `?${queryString}` : ""}`, {
        tag: "screenshots",
        revalidate: 15
    });
};

export const getAllScreenshots = async (query = {}): Promise<IResponse<IAllScreenshot[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/activities/all-screenshots${queryString ? `?${queryString}` : ""}`, {
        tag: "allScreenshots",
        revalidate: 30
    });
};

export const getNotes = async (query = {}): Promise<IResponse<INotes[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/activities/notes${queryString ? `?${queryString}` : ""}`, {
        tag: "screenshots",
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