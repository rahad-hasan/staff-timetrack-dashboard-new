/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { cookies } from "next/headers";

export async function ssrBaseApi(
    endpoint: string,
    {
        method = "GET",
        data,
        cache = "no-store",
        revalidate,
    }: {
        method?: string;
        data?: any;
        cache?: RequestCache;
        revalidate?: number;
    } = {}
) {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    console.log("[SSR API]", { endpoint, hasToken: !!token });

    const options: RequestInit & { next?: { revalidate?: number } } = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
        cache,
    };

    if (revalidate !== undefined) {
        options.next = { revalidate };
    }

    console.log("[SSR API]", {
        endpoint,
        method,
        cache,
        token: !!token,
    })
    const res = await fetch(
        `http://localhost:5000/api/v1${endpoint}`,
        options
    );

    return res.json();
}
