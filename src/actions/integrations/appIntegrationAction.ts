"use server";

import {
    IntegrationStatusResponse,
    IResponse,
    MondayBoard,
    MondayImportPayload,
    MondayImportResult,
} from "@/types/type";
import axios, { AxiosResponse } from "axios";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { baseApi } from "../baseApi";

/**
 * Server-side whitelist of app-integration providers. A new provider
 * (ClickUp, Jira, Asana, Slack) is enabled here + in the client registry —
 * the generic actions below need no changes.
 *
 * `authPrefix` — provider endpoints answer 401 with a message starting with
 * this prefix when the *provider* revoked the token (not a session expiry);
 * baseApi then returns the error envelope instead of logging the user out.
 */
const PROVIDERS = {
    monday: { base: "/monday", tag: "monday-integration", authPrefix: "monday.com" },
} as const;

type ProviderKey = keyof typeof PROVIDERS;

const providerConfig = (provider: string) => {
    const config = PROVIDERS[provider as ProviderKey];
    if (!config) {
        throw new Error(`Unknown integration provider: ${provider}`);
    }
    return config;
};

/* ---------------- generic (same endpoint family for every provider) ---------------- */

export const getIntegrationStatus = async (
    provider: string,
): Promise<IResponse<IntegrationStatusResponse>> => {
    const { base, tag, authPrefix } = providerConfig(provider);
    return await baseApi(`${base}/status`, {
        tag,
        cache: "no-cache",
        providerAuthPrefix: authPrefix,
    });
};

export const getIntegrationAuthUrl = async (
    provider: string,
): Promise<IResponse<string>> => {
    const { base, tag, authPrefix } = providerConfig(provider);
    return await baseApi(`${base}/connect`, {
        tag,
        cache: "no-cache",
        providerAuthPrefix: authPrefix,
    });
};

export const disconnectIntegration = async (
    provider: string,
): Promise<IResponse<IntegrationStatusResponse>> => {
    const { base, tag, authPrefix } = providerConfig(provider);
    return await baseApi(`${base}/disconnect`, {
        method: "DELETE",
        tag,
        cache: "no-cache",
        providerAuthPrefix: authPrefix,
    });
};

/**
 * Import/sync legitimately run for minutes (§4.6) — the server-side fetch
 * used by baseApi is cut off by undici's 5-minute headers timeout, so these
 * two calls go through axios (plain node http, 15-minute ceiling) while
 * returning the exact same envelope shape baseApi produces.
 */
const LONG_RUNNING_TIMEOUT_MS = 15 * 60 * 1000;

const longRunningPost = async <T>(
    path: string,
    authPrefix: string,
    body?: unknown,
): Promise<IResponse<T>> => {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    let res: AxiosResponse;
    try {
        res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1${path}`,
            body ?? {},
            {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    "Content-Type": "application/json",
                },
                timeout: LONG_RUNNING_TIMEOUT_MS,
                validateStatus: () => true,
            },
        );
    } catch {
        return {
            success: false,
            message: "Server is not active. Please try again later.",
        } as IResponse<T>;
    }

    const data = res.data;
    if (res.status === 401) {
        if (
            typeof data?.message === "string" &&
            data.message.startsWith(authPrefix)
        ) {
            return {
                success: false,
                statusCode: 401,
                message: data.message,
                errorMessages: data?.errorMessages,
            } as IResponse<T>;
        }
        redirect("/session-expired");
    }
    if (res.status < 200 || res.status >= 300) {
        return {
            success: false,
            message:
                data?.message ||
                data?.errorMessages?.[0]?.message ||
                `Request failed with ${res.status}`,
            errorMessages: data?.errorMessages,
        } as IResponse<T>;
    }
    return data as IResponse<T>;
};

/* -------- board-picker family (§9: same endpoint family per provider) -------- */

export const getIntegrationBoards = async (
    provider: string,
): Promise<IResponse<MondayBoard[]>> => {
    const { base, tag, authPrefix } = providerConfig(provider);
    return await baseApi(`${base}/boards`, {
        tag,
        cache: "no-cache",
        providerAuthPrefix: authPrefix,
    });
};

export const importIntegrationBoards = async (
    provider: string,
    payload: MondayImportPayload,
): Promise<IResponse<MondayImportResult>> => {
    const { base, tag, authPrefix } = providerConfig(provider);
    const res = await longRunningPost<MondayImportResult>(
        `${base}/import`,
        authPrefix,
        payload,
    );
    if (res?.success) {
        // imported boards become ordinary projects/tasks — refresh those caches
        revalidateTag(tag);
        revalidateTag("projects");
        revalidateTag("tasks");
    }
    return res;
};

export const syncIntegration = async (
    provider: string,
): Promise<IResponse<MondayImportResult>> => {
    const { base, tag, authPrefix } = providerConfig(provider);
    const res = await longRunningPost<MondayImportResult>(
        `${base}/sync`,
        authPrefix,
    );
    if (res?.success) {
        revalidateTag(tag);
        revalidateTag("projects");
        revalidateTag("tasks");
    }
    return res;
};
