"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { ICreateProjectPayload, IProject, IResponse, ISingleProjectData } from "@/types/type";

export const getProjects = async (query = {}): Promise<IResponse<IProject[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/projects${queryString ? `?${queryString}` : ""}`, {
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
        cache: "no-store",
        tag: "projects",
    });
};

export const deleteProject = async (id: number | undefined) => {
    return await baseApi(`/projects/${id}`, {
        method: "DELETE",
        tag: "projects",
    });
};