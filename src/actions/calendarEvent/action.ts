/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { buildQuery } from "@/utils/buildQuery";
// import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IResponse } from "@/types/type";

export const getEvents = async (query = {}): Promise<IResponse<any[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/events${queryString ? `?${queryString}` : ""}`, {
        tag: "events",
    });
};

export const addEvent = async (data: any
    //     {
    //     type: string;
    //     start_date: string;
    //     end_date: string;
    //     reason: string;
    // }
) => {
    return await baseApi(`/events`, {
        method: "POST",
        body: data,
        tag: "events",
        cache: "no-cache",
    });
};

export const rescheduleEvent = async ({ id, data }: { id: number, data: any }) => {
    return await baseApi(`/events/${id}`, {
        method: "PATCH",
        body: data,
        tag: "events",
        cache: "no-cache",
    });
};

