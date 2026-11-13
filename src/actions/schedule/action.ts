"use server";

import { baseApi } from "../baseApi";
import type { QueryParams } from "@/utils/buildQuery";
import { IResponse, ISchedules } from "@/types/type";

export const getAllSchedule = async (query: QueryParams = {}): Promise<IResponse<ISchedules[]>> => {
    return await baseApi(`/schedules`, {
        query,
        tag: "schedules",
    });
};

export const getSingleSchedule = async ({ id }: { id: string }): Promise<IResponse<ISchedules>> => {
    return await baseApi(`/schedules/${id}`, {
        tag: "schedules",
    });
};

export const addSchedule = async (data: ISchedules) => {
    return await baseApi(`/schedules`, {
        method: "POST",
        body: data,
        tag: "schedules",
    });
};

export const assignSchedule = async (data: {
    schedule_id: number,
    member_ids: number[] | string
}) => {
    return await baseApi(`/schedules/assign`, {
        method: "POST",
        body: data,
        tag: "schedules",
    });
};

export const editSchedule = async ({ data, id }: {
    data: ISchedules,
    id: number | undefined
}) => {
    return await baseApi(`/schedules/${id}`, {
        method: "PATCH",
        body: data,
        tag: "schedules",
    });
};

export const deleteSchedule = async (id: number) => {
    return await baseApi(`/schedules/${id}`, {
        method: "DELETE",
        tag: "schedules",
    });
};

export const deleteMemberFromSchedule = async ({ data, id }: { data: { member_id: number }, id: number }) => {
    return await baseApi(`/schedules/remove-members/${id}`, {
        method: "DELETE",
        body: data,
        tag: "schedules",
    });
};