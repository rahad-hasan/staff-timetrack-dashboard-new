"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";

export const getClients = async (query = {}) => {
    const queryString = buildQuery(query);
    return await baseApi(`/clients${queryString ? `?${queryString}` : ""}`, {
        tag: "clients",
    });
};

export const addClient = async (data: {
    name: string,
    email: string,
    phone: string,
    address: string
}) => {
    return await baseApi(`/clients`, {
        method: "POST",
        body: data,
        tag: "clients",
    });
};

export const editClient = async ({ data, id }: {
    data: {
        name: string,
        email: string,
        phone: string,
        address: string
    },
    id: number | undefined
}) => {
    return await baseApi(`/clients/${id}`, {
        method: "PATCH",
        body: data,
        tag: "clients",
    });
};

export const deleteClient = async ({ data, id }: {
    data: {
        is_deleted: boolean,
    },
    id: number | undefined
}) => {
    return await baseApi(`/clients/${id}`, {
        method: "PATCH",
        body: data,
        tag: "clients",
    });
};