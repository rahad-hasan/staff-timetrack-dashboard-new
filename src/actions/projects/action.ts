"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { ICreateProjectPayload, IProject, IResponse } from "@/types/type";

export const getProjects = async (query = {}): Promise<IResponse<IProject[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/projects${queryString ? `?${queryString}` : ""}`, {
        tag: "projects",
    });
};

export const addProject = async (data: ICreateProjectPayload) => {
    return await baseApi(`/projects`, {
        method: "POST",
        body: data,
        tag: "projects",
    });
};

export const editProject = async ({ data, id }: {
    data: Partial<ICreateProjectPayload>,
    id: number | undefined
}) => {
    return await baseApi(`/projects/${id}`, {
        method: "PATCH",
        body: data,
        tag: "projects",
    });
};

export const deleteProject = async ({ data, id }: {
    data: {
        is_deleted: boolean,
    },
    id: number | undefined
}) => {
    return await baseApi(`/projects/${id}`, {
        method: "PATCH",
        body: data,
        tag: "projects",
    });
};