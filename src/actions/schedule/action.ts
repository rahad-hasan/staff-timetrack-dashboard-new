"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IResponse, ISchedules } from "@/types/type";

export const getAllSchedule = async (query = {}): Promise<IResponse<ISchedules[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/schedules${queryString ? `?${queryString}` : ""}`, {
        tag: "schedules",
    });
};

// export const addLeave = async (data: {
//     type: string;
//     start_date: string;
//     end_date: string;
//     reason: string;
// }) => {
//     return await baseApi(`/leaves`, {
//         method: "POST",
//         body: data,
//         tag: "leaves",
//         cache: "no-cache",
//     });
// };

// export const approveRejectLeave = async ({ data }: {
//     data: {
//         leave_id: number,
//         approved: boolean,
//         reject_reason?: string
//     }
// }) => {
//     return await baseApi(`/leaves/update-status`, {
//         method: "PATCH",
//         body: data,
//         tag: "leaves",
//         cache: "no-cache",
//     });
// };

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