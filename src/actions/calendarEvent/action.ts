/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

// import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
// import { ILeaveDetailsResponse, ILeaveRequest, IResponse } from "@/types/type";

// export const getLeave = async (query = {}): Promise<IResponse<ILeaveRequest[]>> => {
//     const queryString = buildQuery(query);
//     return await baseApi(`/leaves${queryString ? `?${queryString}` : ""}`, {
//         tag: "leaves",
//     });
// };

// export const getLeaveDetails = async (query = {}): Promise<IResponse<ILeaveDetailsResponse>> => {
//     const queryString = buildQuery(query);
//     return await baseApi(`/leaves/details${queryString ? `?${queryString}` : ""}`, {
//         tag: "leavesDetails",
//     });
// };

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