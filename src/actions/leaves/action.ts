"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IMember, IResponse } from "@/types/type";

export const getLeave = async (query = {}): Promise<IResponse<IMember[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/leaves${queryString ? `?${queryString}` : ""}`, {
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

export const editLeave = async ({ data, id }: {
    data: {
        type: string;
        start_date: string;
        end_date: string;
        reason: string;
    },
    id: number | undefined
}) => {
    return await baseApi(`/leaves/${id}`, {
        method: "PATCH",
        body: data,
        tag: "leaves",
    });
};

export const deleteLeave = async ({ data, id }: {
    data: {
        is_deleted: boolean,
    },
    id: number | undefined
}) => {
    return await baseApi(`/leaves/${id}`, {
        method: "PATCH",
        body: data,
        tag: "leaves",
    });
};