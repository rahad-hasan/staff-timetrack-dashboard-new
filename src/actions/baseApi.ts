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
  /**
   * Opts this call out of the global non-GET `402 → /settings/billing` rule.
   *
   * That rule exists so an ordinary write rejected for non-payment lands the
   * user somewhere they can fix it. On the checkout and payment-method
   * surfaces it does the opposite: those endpoints ARE the fix, and a 402 from
   * one of them would eject the user out of a half-finished payment, losing
   * the PaymentIntent they were confirming. Those callers render the envelope
   * inline instead.
   *
   * Deliberately narrow — only the billing payment actions set it. Widening it
   * would quietly disable the payment-blocked redirect app-wide.
   */
  skipPaymentRedirect?: boolean;
  /**
   * Suppresses the automatic `revalidateTag(tag)` that follows every non-GET.
   *
   * For a POST that is really a READ — a price quote, a proration preview —
   * that revalidation is wrong twice over. Nothing changed, so there is no
   * cache to invalidate; and Next 15 makes `revalidateTag` during a render a
   * hard error, so a server component that fetches such a preview to paint its
   * first frame crashes the whole route with a server-side exception.
   */
  skipRevalidate?: boolean;
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
    skipPaymentRedirect = false,
    skipRevalidate = false,
  } = options;

  const fullUrl = url.startsWith("http")
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL}/api/v1${url}`;
  console.log(fullUrl)
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
    // `skipPaymentRedirect` exempts the checkout / payment-method actions —
    // they are the resolution path, so bouncing them here would strand a
    // part-confirmed payment (see the option's doc comment).
    if (res.status === 402 && !skipPaymentRedirect) {
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
  if (method !== "GET" && tag && !skipRevalidate) {
    try {
      revalidateTag(tag);
    } catch (error) {
      // Next 15 throws when this runs inside a render. Callers that fetch
      // during render should pass `skipRevalidate` (a POST-shaped read has
      // nothing to invalidate anyway) — but failing to refresh a cache must
      // never take the page down with it, least of all a payment page. Log it
      // and carry on: every billing read is `cache: "no-cache"` regardless.
      console.warn(`revalidateTag("${tag}") skipped:`, error);
    }
  }

  if (res.status === 204) return null as T;

  return data as T;
}
