/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IResponse, ISingleTask, ITask } from "@/types/type";
import { API_TAGS } from "@/constants/api.constants";

export const getTasks = async (query = {}): Promise<IResponse<ITask[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/tasks${queryString ? `?${queryString}` : ""}`, {
        tag: API_TAGS.TASKS,
    });
};

export const getSingleTask = async (id: number): Promise<IResponse<ISingleTask>> => {
    return await baseApi(`/tasks/${id}`, {
        tag: API_TAGS.TASKS,
    });
};

export const addTask = async (data: any) => {
    return await baseApi(`/tasks`, {
        method: "POST",
        body: data,
        tag: API_TAGS.TASKS,
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
        cache: "no-cache",
        tag: API_TAGS.TASKS,
    });
};

export const deleteTask = async (id: number | undefined) => {
    return await baseApi(`/tasks/${id}`, {
        method: "DELETE",
        tag: API_TAGS.TASKS,
        cache: "no-cache",
    });
};