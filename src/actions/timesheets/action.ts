/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IDailyTimeTrackerData, IManualTimeEntry, IResponse } from "@/types/type";

export const getManualTimeEntry = async (query = {}): Promise<IResponse<IManualTimeEntry[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/time-entries/manual-time-entry${queryString ? `?${queryString}` : ""}`, {
        tag: "manualTimeEntry",
    });
};

export const addManualTimeEntry = async (
    data: {
        project_id: number;
        task_id: number;
        start_time: string;
        end_time: string;
        note?: string;
    }
) => {
    return await baseApi(`/time-entries/manual-time-entry`, {
        method: "POST",
        body: data,
        tag: "manualTimeEntry",
    });
};

export const editManualTimeEntry = async ({ data, id }: {
    data: {
        project_id: number;
        task_id: number;
        start_time: string;
        end_time: string;
        note?: string;
    },
    id: number | undefined
}) => {
    return await baseApi(`/time-entries/manual-time-entry/${id}`, {
        method: "PATCH",
        body: data,
        tag: "manualTimeEntry",
    });
};

export const approveRejectManualTimeEntry = async ({ data, id }: {
    data: {
        is_approved: boolean;
    },
    id: number | undefined
}) => {
    return await baseApi(`/time-entries/approved/${id}`, {
        method: "PATCH",
        body: data,
        tag: "manualTimeEntry",
    });
};

export const getDailyTimeEntry = async (query = {}): Promise<IResponse<IDailyTimeTrackerData[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/time-entries/daily-time-sheet${queryString ? `?${queryString}` : ""}`, {
        tag: "DailyTimeEntry",
    });
};

export const getWeeklyAndMonthlyTimeEntry = async (query = {}): Promise<IResponse<any>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/time-entries/weekly-time-sheet${queryString ? `?${queryString}` : ""}`, {
        tag: "DailyTimeEntry",
        cache: "no-store"
    });
};