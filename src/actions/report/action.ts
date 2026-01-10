/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IResponse, ITimeSheetEntry } from "@/types/type";

export const getTimeEntry = async (query = {}):Promise<IResponse<ITimeSheetEntry[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/time-entries${queryString ? `?${queryString}` : ""}`, {
        tag: "timeEntry",
    });
};

export const getDateBaseTimeEntry = async (query = {}):Promise<IResponse<any>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/activities/duration${queryString ? `?${queryString}` : ""}`, {
        tag: "timeEntry",
    });
};

export const getAttendance = async (query = {}):Promise<IResponse<ITimeSheetEntry[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/check-in-out${queryString ? `?${queryString}` : ""}`, {
        tag: "attendance",
    });
};
