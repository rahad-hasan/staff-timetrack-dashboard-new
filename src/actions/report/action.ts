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

export const getDateBaseTimeEntry = async (query = {}):Promise<IResponse<ITimeSheetEntry[]>> => {
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

// export const addTimeEntry = async (data: {
//     name: string,
//     email: string,
//     role: string,
//     password: string,
// }) => {
//     return await baseApi(`/time-entries`, {
//         method: "POST",
//         body: data,
//         tag: "timeEntry",
//     });
// };

// export const editTimeEntry = async ({ data, id }: {
//     data: {
//         name: string,
//         // email: string,
//         role: string,
//         password: string,
//     },
//     id: number | undefined
// }) => {
//     return await baseApi(`/time-entries/${id}`, {
//         method: "PATCH",
//         body: data,
//         tag: "timeEntry",
//     });
// };

// export const deleteTimeEntry = async ({ data, id }: {
//     data: {
//         is_deleted: boolean,
//     },
//     id: number | undefined
// }) => {
//     return await baseApi(`/time-entries/${id}`, {
//         method: "PATCH",
//         body: data,
//         tag: "timeEntry",
//     });
// };