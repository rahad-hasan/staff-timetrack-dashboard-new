"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IManualTimeEntry, IResponse } from "@/types/type";

export const getManualTimeEntry = async (query = {}):Promise<IResponse<IManualTimeEntry[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/time-entries/manual-time-entry${queryString ? `?${queryString}` : ""}`, {
        tag: "manualTimeEntry",
    });
};

export const addManualTimeEntry = async (data: {
    name: string,
    email: string,
    role: string,
    password: string,
}) => {
    return await baseApi(`/time-entries/manual-time-entry`, {
        method: "POST",
        body: data,
        tag: "manualTimeEntry",
    });
};

export const editManualTimeEntry = async ({ data, id }: {
    data: {
        name: string,
        // email: string,
        role: string,
        password: string,
    },
    id: number | undefined
}) => {
    return await baseApi(`/time-entries/manual-time-entry/${id}`, {
        method: "PATCH",
        body: data,
        tag: "manualTimeEntry",
    });
};
