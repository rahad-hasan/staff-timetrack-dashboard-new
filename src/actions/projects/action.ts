"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";

export const getProjects = async (query = {}) => {
    const queryString = buildQuery(query);
    return await baseApi(`/projects${queryString ? `?${queryString}` : ""}`, {
        tag: "projects",
    });
};

export const addProject = async (data: {
    name: string,
    email: string,
    phone: string,
    address: string
}) => {
    return await baseApi(`/projects`, {
        method: "POST",
        body: data,
        tag: "projects",
    });
};

export const editProject = async ({ data, id }: {
    data: {
        name: string,
        email: string,
        phone: string,
        address: string
    },
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