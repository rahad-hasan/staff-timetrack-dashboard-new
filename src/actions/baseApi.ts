/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface BaseApiOptions {
  method?: Method;
  body?: any;
  isFormData?: boolean;
  tag?: string;
  headers?: HeadersInit;
  cache?: RequestCache;
  revalidate?: number;
  /**
   * Integration endpoints (e.g. /monday/*) answer 401 when the *provider*
   * revokes the company token — that is not a session expiry. When the 401
   * body's message starts with this prefix the error envelope is returned
   * to the caller instead of redirecting to /session-expired.
   */
  providerAuthPrefix?: string;
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
    providerAuthPrefix,
  } = options;

  const fullUrl = url.startsWith("http")
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL}/api/v1${url}`;

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
  } catch {
    // 🌐 Network / server down / DNS / CORS errors land here
    // throw new Error("Server is not active. Please try again later.");
    return {
      success: false,
      message: "Server is not active. Please try again later.",
    } as T;
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
    if (providerAuthPrefix) {
      let body401: any = null;
      try {
        body401 = await res.clone().json();
      } catch {
        body401 = null;
      }
      if (
        typeof body401?.message === "string" &&
        body401.message.startsWith(providerAuthPrefix)
      ) {
        return {
          success: false,
          statusCode: 401,
          message: body401.message,
          errorMessages: body401?.errorMessages,
        } as T;
      }
    }
    // const cookieStore = await cookies();
    // cookieStore.delete("accessToken");
    redirect("/session-expired");
  }

  await buildHeaders(isFormData, customHeaders);

  if (method !== "GET" && !res.ok) {
    let errBody: any = null;
    try {
      errBody = await res.json();
    } catch {
      errBody = null;
    }
    // Global billing rule (billing guide §1): a write rejected with 402 means
    // the company is payment-blocked — land the user on the billing page with
    // the backend's message instead of leaving each caller to handle it.
    // GETs are exempt: the dashboard stays browsable during payment failure,
    // and the billing page's own reads must never redirect-loop.
    if (res.status === 402) {
      const msg =
        typeof errBody?.message === "string" ? errBody.message : "";
      redirect(
        `/settings/billing${msg ? `?blocked=${encodeURIComponent(msg)}` : ""}`,
      );
    }
    return {
      success: false,
      message:
        errBody?.message ||
        errBody?.errorMessages?.[0]?.message ||
        `Request failed with ${res.status}`,
      ...errBody,
      statusCode: res.status,
    } as T;
  }

  // if (!res.ok) {
  //   // const text = await res.text();
  //   // throw new Error(text || `Request failed with ${res.status}`);
  //   return (
  //     {
  //       success: false,
  //       message: `Request failed with ${res}`,
  //     }
  //   ) as T;
  // }

  // // 🔄 auto revalidate on mutations
  // if (method !== "GET" && tag) {
  //   revalidateTag(tag);
  // }

  // if (res.status === 204) return null as T;

  // return res.json() as Promise<T>;

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    // Trello reports an unreadable stored token as 400 (not 401) with
    // "Trello access token is missing. Please reconnect the account." but the
    // contract says to treat it as connection lost — normalize it onto the
    // provider-401 envelope above so every caller branch behaves identically.
    if (
      providerAuthPrefix &&
      typeof data?.message === "string" &&
      data.message.startsWith(providerAuthPrefix) &&
      data.message.includes("access token is missing")
    ) {
      return {
        success: false,
        statusCode: 401,
        message: data.message,
        errorMessages: data?.errorMessages,
      } as T;
    }
    return {
      success: false,
      statusCode: res.status,
      message:
        data?.message ||
        data?.errorMessages?.[0]?.message ||
        `Request failed with ${res.status}`,
      errorMessages: data?.errorMessages,
    } as T;
  }

  // 🔄 auto revalidate on mutations
  if (method !== "GET" && tag) {
    revalidateTag(tag);
  }

  if (res.status === 204) return null as T;

  return data as T;
}
