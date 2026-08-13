/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
// import { INotificationItem } from "@/types/type";
import { IResponse } from "@/types/type";
import { baseApi } from "../baseApi";
import { buildQuery } from "@/utils/buildQuery";
import { API_TAGS } from "@/constants/api.constants";

export const getNotifications = async (query = {}): Promise<IResponse<any>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/notifications${queryString ? `?${queryString}` : ""}`, {
        tag: API_TAGS.NOTIFICATIONS,
        revalidate: 15,
        cache: "no-cache",
    });
};

export const getNotificationsCount = async (query = {}): Promise<IResponse<any>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/notifications/counts${queryString ? `?${queryString}` : ""}`, {
        tag: API_TAGS.NOTIFICATIONS,
        revalidate: 15,
        cache: "no-cache",
    });
};

export const readNotifications = async ({ data }: any) => {
    return await baseApi(`/notifications/update-read-status`, {
        method: "PATCH",
        body: data,
        tag: API_TAGS.NOTIFICATIONS,
        cache: "no-cache",
    });
};
