"use server";

import { GoogleConnectedResponse, IResponse, MicrosoftConnectedResponse } from "@/types/type";
import { baseApi } from "../baseApi";

/*
 * Google Calendar / Microsoft Teams connections for the calendar screens.
 *
 * Untagged: every reader of this state is a client component that re-reads
 * it itself after connecting or disconnecting (`useCalendarConnectFlow`, the
 * connect buttons). A tag on the disconnects only made each one re-render the
 * whole current route into its response, for nothing.
 */

export const getGoogleAuthUrl = async (): Promise<IResponse<string>> => {
    return await baseApi(`/google/connect`);
};

export const getGoogleConnected = async (): Promise<
    IResponse<GoogleConnectedResponse>
> => {
    return await baseApi(`/google/connected`);
};

export const disconnectGoogle = async () => {
    return await baseApi(`/google/disconnect`, {
        method: "DELETE",
    });
};

/* ---------------- Microsoft Teams ---------------- */

export const getMicrosoftAuthUrl = async (): Promise<IResponse<string>> => {
    return await baseApi(`/microsoft/connect`);
};

export const getMicrosoftConnected = async (): Promise<
    IResponse<MicrosoftConnectedResponse>
> => {
    return await baseApi(`/microsoft/connected`);
};

export const disconnectMicrosoft = async () => {
    return await baseApi(`/microsoft/disconnect`, {
        method: "DELETE",
    });
};
