"use server";

import { baseApi } from "../baseApi";
import type { QueryParams } from "@/utils/buildQuery";
import { ICompany, IResponse } from "@/types/type";

export const getCompanyInfo = async (query: QueryParams = {}): Promise<IResponse<ICompany>> => {
    return await baseApi(`/company/own-company/info`, {
        query,
        tag: "company",
    });
};

export const updateCompanyInfo = async ({ data, id }: { data: Partial<ICompany>, id: number }) => {
    return await baseApi(`/company/${id}`, {
        method: "PATCH",
        body: data,
        tag: "company",
    });
};
