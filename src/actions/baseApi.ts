/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

const BASE_URL = "https://server.stafftimetrack.com/api/v1";

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

async function buildHeaders(
  isFormData?: boolean,
  customHeaders?: HeadersInit,
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
  options: BaseApiOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    isFormData = false,
    tag,
    headers: customHeaders,
    cache = "force-cache",
    // cache = "no-cache",
    revalidate = 60,
  } = options;

  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

  const doFetch = async () =>
    fetch(fullUrl, {
      method,
      headers: await buildHeaders(isFormData, customHeaders),
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      credentials: "include",
      cache,
      ...(method === "GET" &&
        (tag || revalidate) && {
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

  // if (res.status === 401) {
  //     const headerList = await headers();
  //     const referer = headerList.get("referer") || "";

  //     // 🛑 STOP the loop if we already tried refreshing once
  //     if (referer.includes("refreshed=true")) {
  //         console.log("Refresh loop detected. Redirecting to login.");
  //         redirect("/?reason=session_expired");
  //     }

  //     const urlObj = new URL(referer || "http://localhost:3000/");
  //     // Add a flag to the redirect URL
  //     urlObj.searchParams.set("refreshed", "true");
  //     const currentPath = urlObj.pathname + urlObj.search;

  //     redirect(`/api/auth/refresh?redirect=${encodeURIComponent(currentPath)}`);
  // }
  if (res.status === 401) {
    // const cookieStore = await cookies();
    // cookieStore.delete("accessToken");
    redirect("/session-expired");
  }

  /* 🚀 DEBUG BLOCK: Request Details */
  await buildHeaders(isFormData, customHeaders);

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
