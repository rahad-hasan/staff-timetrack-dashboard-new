/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
// import { INotificationItem } from "@/types/type";
import { IResponse } from "@/types/type";
import { baseApi } from "../baseApi";
import { buildQuery } from "@/utils/buildQuery";

export const getNotifications = async (query = {}): Promise<IResponse<any>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/notifications${queryString ? `?${queryString}` : ""}`, {
        tag: "notifications",
        revalidate: 15,
    });
};

export const readNotifications = async ({ data }: any) => {
    return await baseApi(`/notifications/update-read-status`, {
        method: "PATCH",
        body: data,
        tag: "notifications",
    });
};

