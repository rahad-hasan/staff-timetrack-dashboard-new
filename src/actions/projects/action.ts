"use server";

import { baseApi } from "../baseApi";
import type { QueryParams } from "@/utils/buildQuery";
import { ICreateProjectPayload, IProject, IResponse, ISingleProjectData } from "@/types/type";

export const getProjects = async (query: QueryParams = {}): Promise<IResponse<IProject[]>> => {
    return await baseApi(`/projects`, {
        query,
        tag: "projects",
    });
};

export const getSingleProject = async ({ id }: { id: string }): Promise<IResponse<ISingleProjectData>> => {
    return await baseApi(`/projects/${id}`, {
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

export const deleteProject = async (id: number | undefined) => {
    return await baseApi(`/projects/${id}`, {
        method: "DELETE",
        tag: "projects",
    });
};