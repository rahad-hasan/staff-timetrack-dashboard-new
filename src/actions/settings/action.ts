"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { ICompany, IResponse } from "@/types/type";

export const getCompanyInfo = async (query = {}): Promise<IResponse<ICompany>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/company/own-company/info${queryString ? `?${queryString}` : ""}`, {
        tag: "company",
    });
};

export const updateCompanyInfo = async ({ data, id }: { data: Partial<ICompany>, id: number }) => {
    return await baseApi(`/company/${id}`, {
        method: "PATCH",
        body: data,
        tag: "company",
        cache: "no-cache",
    });
};