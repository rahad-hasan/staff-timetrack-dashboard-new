"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { ILeaveDetailsResponse, ILeaveRequest, IResponse } from "@/types/type";

export const getLeave = async (query = {}): Promise<IResponse<ILeaveRequest[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/leaves${queryString ? `?${queryString}` : ""}`, {
        tag: "leaves",
    });
};

export const getLeaveDetails = async (query = {}): Promise<IResponse<ILeaveDetailsResponse>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/leaves/details${queryString ? `?${queryString}` : ""}`, {
        tag: "leaves",
    });
};

export const addLeave = async (data: {
    type: string;
    start_date: string;
    end_date: string;
    reason: string;
}) => {
    return await baseApi(`/leaves`, {
        method: "POST",
        body: data,
        tag: "leaves",
    });
};

export const approveRejectLeave = async ({ data }: {
    data: {
        leave_id: number,
        approved: boolean,
        reject_reason?: string
    }
}) => {
    return await baseApi(`/leaves/update-status`, {
        method: "PATCH",
        body: data,
        tag: "leaves",
    });
};

// export const deleteLeave = async ({ data, id }: {
//     data: {
//         is_deleted: boolean,
//     },
//     id: number | undefined
// }) => {
//     return await baseApi(`/leaves/${id}`, {
//         method: "PATCH",
//         body: data,
//         tag: "leaves",
//     });
// };