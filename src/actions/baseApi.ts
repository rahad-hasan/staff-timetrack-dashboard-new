/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";

const BASE_URL = "http://localhost:5000/api/v1";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface BaseApiOptions {
    method?: Method;
    body?: any;
    isFormData?: boolean;
    tag?: string;
    headers?: HeadersInit;
    cache?: RequestCache;
    revalidate?: number;
}

/* ---------------- helpers ---------------- */

async function getAccessToken() {
    const cookieStore = await cookies();
    return cookieStore.get("accessToken")?.value;
}

async function refreshAccessTokenFromServer() {
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error("Failed to refresh access token");
    }

    const { success, accessToken, refreshToken, message } = await res.json();

    if (!success) {
        throw new Error(message || "Refresh token invalid");
    }

    const cookieStore = await cookies();
    cookieStore.set("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        path: "/",
    });
    cookieStore.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        path: "/",
    });
}

async function buildHeaders(
    isFormData?: boolean,
    customHeaders?: HeadersInit
): Promise<Record<string, string>> {
    const token = await getAccessToken();

    const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(customHeaders as Record<string, string> | undefined),
    };

    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

/* ---------------- base api ---------------- */

export async function baseApi<T = any>(
    url: string,
    options: BaseApiOptions = {}
): Promise<T> {
    const {
        method = "GET",
        body,
        isFormData = false,
        tag,
        headers: customHeaders,
        cache = "force-cache",
        revalidate,
    } = options;

    const fullUrl = url.startsWith("http")
        ? url
        : `${BASE_URL}${url}`;

    const doFetch = async () =>
        fetch(fullUrl, {
            method,
            headers: await buildHeaders(isFormData, customHeaders),
            body: body
                ? isFormData
                    ? body
                    : JSON.stringify(body)
                : undefined,
            credentials: "include",
            cache,
            ...(method === "GET" && (tag || revalidate) && {
                next: {
                    ...(tag && { tags: [tag] }),
                    ...(revalidate !== undefined && { revalidate }),
                },
            }),
        });
    let res;
    try {
        res = await doFetch();
    } catch (error) {
        // 🌐 Network / server down / DNS / CORS errors land here
        throw new Error("Server is not active. Please try again later.");
    }

    // 🔁 auto refresh on 401
    if (res.status === 401) {
        await refreshAccessTokenFromServer();
        res = await doFetch();
    }

    if (method !== "GET" && !res.ok) {
        return res.json() as Promise<T>;
    }

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
    }

    // 🔄 auto revalidate on mutations
    if (method !== "GET" && tag) {
        revalidateTag(tag);
    }

    if (res.status === 204) return null as T;

    return res.json() as Promise<T>;
}
