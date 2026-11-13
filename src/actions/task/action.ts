/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { baseApi } from "../baseApi";
import type { QueryParams } from "@/utils/buildQuery";
import { IResponse, ISingleTask, ITask } from "@/types/type";

export const getTasks = async (query: QueryParams = {}): Promise<IResponse<ITask[]>> => {
    return await baseApi(`/tasks`, {
        query,
        tag: "tasks",
    });
};

/** One option of a task picker. */
export interface ITaskOption {
    id: number;
    name: string;
}

/**
 * A project's open tasks the signed-in user may pick (the tasks GET /tasks
 * lists for them), by name. The API caps the list; `truncated` says there are
 * more, which `search` (a case-insensitive part of the name) narrows down.
 */
export const getTaskOptions = async (query: {
    project_id: number;
    search?: string;
}): Promise<IResponse<{ tasks: ITaskOption[]; truncated: boolean }>> => {
    return await baseApi(`/tasks/dropdown`, {
        query,
        tag: "tasks",
    });
};

export const getSingleTask = async (id: number): Promise<IResponse<ISingleTask>> => {
    return await baseApi(`/tasks/${id}`, {
        tag: "tasks",
    });
};

export const addTask = async (data: any) => {
    return await baseApi(`/tasks`, {
        method: "POST",
        body: data,
        tag: "tasks",
    });
};

export const editTask = async ({ data, id }: {
    data: any,
    id: number | undefined
}) => {
    return await baseApi(`/tasks/${id}`, {
        method: "PATCH",
        body: data,
        tag: "tasks",
    });
};

export const deleteTask = async (id: number | undefined) => {
    return await baseApi(`/tasks/${id}`, {
        method: "DELETE",
        tag: "tasks",
    });
};