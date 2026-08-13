"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { ICreateProjectPayload, IProject, IResponse, ISingleProjectData } from "@/types/type";
import { API_TAGS } from "@/constants/api.constants";

export const getProjects = async (query = {}): Promise<IResponse<IProject[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/projects${queryString ? `?${queryString}` : ""}`, {
        tag: API_TAGS.PROJECTS,
    });
};

export const getSingleProject = async ({ id }: { id: string }): Promise<IResponse<ISingleProjectData>> => {
    return await baseApi(`/projects/${id}`, {
        tag: API_TAGS.PROJECTS,
    });
};

export const addProject = async (data: ICreateProjectPayload) => {
    return await baseApi(`/projects`, {
        method: "POST",
        body: data,
        tag: API_TAGS.PROJECTS,
        cache: "no-cache",
    });
};

export const editProject = async ({ data, id }: {
    data: Partial<ICreateProjectPayload>,
    id: number | undefined
}) => {
    return await baseApi(`/projects/${id}`, {
        method: "PATCH",
        body: data,
        cache: "no-cache",
        tag: API_TAGS.PROJECTS,
    });
};

export const deleteProject = async (id: number | undefined) => {
    return await baseApi(`/projects/${id}`, {
        method: "DELETE",
        tag: API_TAGS.PROJECTS,
        cache: "no-cache",
    });
};