/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IResponse, ITask } from "@/types/type";

export const getTasks = async (query = {}): Promise<IResponse<ITask[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/tasks${queryString ? `?${queryString}` : ""}`, {
        tag: "tasks",
    });
};

export const addTask = async (data: any) => {
    return await baseApi(`/tasks`, {
        method: "POST",
        body: data,
        tag: "tasks",
        cache: "no-cache",
    });
};

export const editTask = async ({ data, id }: {
    data: any,
    id: number | undefined
}) => {
    return await baseApi(`/tasks/${id}`, {
        method: "PATCH",
        body: data,
        cache: "no-store",
        tag: "tasks",
    });
};

export const deleteTask = async (id: number | undefined) => {
    return await baseApi(`/tasks/${id}`, {
        method: "DELETE",
        tag: "tasks",
    });
};