import { GoogleConnectedResponse, GoogleEventsListItem, GoogleStatusFullResponse, IResponse, MicrosoftConnectedResponse, MicrosoftEventsListItem, MicrosoftStatusFullResponse } from "@/types/type";
import { baseApi } from "../baseApi";
import { buildQuery } from "@/utils/buildQuery";
import { API_TAGS } from "@/constants/api.constants";


export const getGoogleAuthUrl = async (): Promise<IResponse<string>> => {
    return await baseApi(`/google/connect`, {
        tag: API_TAGS.googleINTEGRATION,
        cache: "no-cache",
    });
};

export const getGoogleConnected = async (): Promise<
    IResponse<GoogleConnectedResponse>
> => {
    return await baseApi(`/google/connected`, {
        tag: API_TAGS.googleINTEGRATION,
        cache: "no-cache",
    });
};

export const getGoogleStatus = async (): Promise<
    IResponse<GoogleStatusFullResponse>
> => {
    return await baseApi(`/google/status`, {
        tag: API_TAGS.googleINTEGRATION,
        cache: "no-cache",
    });
};

export const disconnectGoogle = async () => {
    return await baseApi(`/google/disconnect`, {
        method: "DELETE",
        tag: API_TAGS.googleINTEGRATION,
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
            tag: API_TAGS.googleEVENTS,
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
        tag: API_TAGS.googleINTEGRATION,
        cache: "no-cache",
    });
};

export const deleteGoogleEvent = async (eventId: string) => {
    return await baseApi(`/google/events/${eventId}`, {
        method: "DELETE",
        tag: API_TAGS.googleEVENTS,
        cache: "no-cache",
    });
};

/* ---------------- Microsoft Teams ---------------- */

export const getMicrosoftAuthUrl = async (): Promise<IResponse<string>> => {
    return await baseApi(`/microsoft/connect`, {
        tag: API_TAGS.microsoftINTEGRATION,
        cache: "no-cache",
    });
};

export const getMicrosoftConnected = async (): Promise<
    IResponse<MicrosoftConnectedResponse>
> => {
    return await baseApi(`/microsoft/connected`, {
        tag: API_TAGS.microsoftINTEGRATION,
        cache: "no-cache",
    });
};

export const getMicrosoftStatus = async (): Promise<
    IResponse<MicrosoftStatusFullResponse>
> => {
    return await baseApi(`/microsoft/status`, {
        tag: API_TAGS.microsoftINTEGRATION,
        cache: "no-cache",
    });
};

export const disconnectMicrosoft = async () => {
    return await baseApi(`/microsoft/disconnect`, {
        method: "DELETE",
        tag: API_TAGS.microsoftINTEGRATION,
        cache: "no-cache",
    });
};

export const getMicrosoftEvents = async (query: {
    start_date: string;
    end_date: string;
}): Promise<IResponse<MicrosoftEventsListItem[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(
        `/microsoft/events${queryString ? `?${queryString}` : ""}`,
        {
            tag: API_TAGS.microsoftEVENTS,
            cache: "no-cache",
        },
    );
};
