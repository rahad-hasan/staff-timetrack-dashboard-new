"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";

export const getMembers = async (query = {}) => {
    const queryString = buildQuery(query);
    return await baseApi(`/auth/employees${queryString ? `?${queryString}` : ""}`, {
        tag: "members",
    });
};

export const addMember = async (data: {
    name: string,
    email: string,
    role: string,
    password: string,
}) => {
    return await baseApi(`/auth/employees`, {
        method: "POST",
        body: data,
        tag: "members",
    });
};

export const editMember = async ({ data, id }: {
    data: {
        name: string,
        // email: string,
        role: string,
        password: string,
    },
    id: number | undefined
}) => {
    return await baseApi(`/auth/employees/${id}`, {
        method: "PATCH",
        body: data,
        tag: "members",
    });
};

export const deleteMember = async ({ data, id }: {
    data: {
        is_deleted: boolean,
    },
    id: number | undefined
}) => {
    return await baseApi(`/auth/employees/${id}`, {
        method: "PATCH",
        body: data,
        tag: "members",
    });
};