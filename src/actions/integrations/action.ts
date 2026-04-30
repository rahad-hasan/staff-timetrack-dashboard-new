"use server";

import { baseApi } from "../baseApi";
import { buildQuery } from "@/utils/buildQuery";
import {
    GoogleConnectedResponse,
    GoogleEventsListItem,
    GoogleStatusFullResponse,
    IResponse,
} from "@/types/type";

export const getGoogleAuthUrl = async (): Promise<IResponse<string>> => {
    return await baseApi(`/google/connect`, {
        tag: "google-integration",
        cache: "no-cache",
    });
};

export const getGoogleConnected = async (): Promise<
    IResponse<GoogleConnectedResponse>
> => {
    return await baseApi(`/google/connected`, {
        tag: "google-integration",
        cache: "no-cache",
    });
};

export const getGoogleStatus = async (): Promise<
    IResponse<GoogleStatusFullResponse>
> => {
    return await baseApi(`/google/status`, {
        tag: "google-integration",
        cache: "no-cache",
    });
};

export const disconnectGoogle = async () => {
    return await baseApi(`/google/disconnect`, {
        method: "DELETE",
        tag: "google-integration",
        cache: "no-cache",
    });
};

export const getGoogleEvents = async (query: {
    start_date: string;
    end_date: string;
    calendar_id?: string;
}): Promise<IResponse<GoogleEventsListItem[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(
        `/google/events${queryString ? `?${queryString}` : ""}`,
        {
            tag: "google-events",
            cache: "no-cache",
        },
    );
};

export const generateGoogleMeetLink = async (data: {
    title: string;
    start_time: string;
    end_time: string;
}) => {
    return await baseApi(`/google/meet-link`, {
        method: "POST",
        body: data,
        tag: "google-integration",
        cache: "no-cache",
    });
};

export const deleteGoogleEvent = async (eventId: string) => {
    return await baseApi(`/google/events/${eventId}`, {
        method: "DELETE",
        tag: "google-events",
        cache: "no-cache",
    });
};
