"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { API_TAGS } from "@/constants/api.constants";

export const getClients = async (query = {}) => {
    const queryString = buildQuery(query);
    return await baseApi(`/clients${queryString ? `?${queryString}` : ""}`, {
        tag: API_TAGS.CLIENTS,
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
        tag: API_TAGS.CLIENTS,
        cache: "no-cache",
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
        tag: API_TAGS.CLIENTS,
        cache: "no-cache",
    });
};

export const deleteClient = async (id: number | undefined) => {
    return await baseApi(`/clients/${id}`, {
        method: "DELETE",
        tag: API_TAGS.CLIENTS,
    });
};