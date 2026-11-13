/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { cookies, headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { BILLING_URL, paymentBlockedMessageForMember } from "@/lib/billing";
import { hasRole, MANAGEMENT_ROLES } from "@/lib/roles";
import { LOG_REQUESTS, logRequest, SERVER_NOT_ACTIVE } from "@/lib/server/apiClient";
import { buildQuery, type QueryParams } from "@/utils/buildQuery";
import { getDecodedUser } from "@/utils/decodedLogInUser";

/**
 * The dashboard's one server-side client for the backend API.
 *
 * Deliberately NOT a "use server" module. Every export of a "use server" file
 * is a public endpoint: as soon as a client bundle imports it, its action id
 * ships to the browser and anyone can invoke it — and an exposed `baseApi` is
 * an open proxy (any path, any method, sent from inside our network). Domain
 * action files ("use server") wrap it with fixed paths; `server-only` turns a
 * client import into a build error instead of a vulnerability.
 *
 * ## Caching contract
 *
 * Every request is LIVE (`cache: "no-store"`) unless a GET opts in with
 * `cacheFor`. Do not change that default:
 *
 * - A time tracker's data changes with nobody touching this app — the desktop
 *   tracker uploads time, activity and screenshots all day — so a shared cache
 *   can only ever be wrong about it.
 * - Next's Data Cache is stale-while-revalidate: once an entry's window passes,
 *   the NEXT request is still answered with the old body while a refresh runs
 *   in the background. An idle tab's first view could be days old.
 * - Entries are keyed by URL + headers, Authorization included, so one only
 *   ever serves the session that wrote it: near-zero reuse for per-user data,
 *   one file on disk per token, forever.
 * - Under `force-cache` Next also stores 200 responses to POST/PUT/PATCH/DELETE
 *   (keyed by URL, method, headers and body) and answers a repeat of the same
 *   write from disk — it never reaches the API.
 *
 * Writes stay read-your-own without any cache bookkeeping: a successful write
 * revalidates its `tag`, which makes a server action re-render the current
 * route — layouts included — into its own response, and with live reads that
 * re-render is fresh by construction. No tag has to enumerate every view a
 * write affects.
 */

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface BaseApiOptions {
  method?: Method;
  body?: any;
  isFormData?: boolean;
  /** Query string parameters, serialised by `buildQuery` (empty values are dropped). */
  query?: QueryParams;
  /**
   * Cache tag(s). After a successful write each is revalidated (unless
   * `skipRevalidate`), which is what makes a server action ship a fresh render
   * of the current route. On a GET they label the Data Cache entry and only
   * matter together with `cacheFor`.
   */
  tag?: string | readonly string[];
  headers?: Record<string, string>;
  /**
   * GET only. Serve the response from Next's shared Data Cache for up to this
   * many seconds (stale-while-revalidate; see the module comment).
   *
   * For STATIC reference data only — a fixed catalogue that changes with
   * deploys, never with a tenant's actions or the time of day. Anything a user
   * can edit, or the tracker can change, must stay live.
   */
  cacheFor?: number;
  /**
   * A 401 normally means the session is gone, so the user is sent to
   * /session-expired. Route handlers set this to `false` to receive the 401
   * envelope instead: they must answer their `fetch()` caller with JSON, not
   * with a redirect to an HTML page.
   */
  redirectOnUnauthorized?: boolean;
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

/**
 * The browser's address, for the API's IP-keyed rate limits.
 *
 * Every call here is made by this server, so without it the API counts all
 * web users as ONE address: 50 failed sign-ins in 15 minutes locked sign-in
 * for everybody. With API_RELAY_SECRET set (the API's DASHBOARD_RELAY_SECRET)
 * the address this server's own proxy saw (nginx's X-Real-IP, which a browser
 * cannot set) is passed along, and the API trusts it because of the secret.
 * Unset, or with no such header (local runs), nothing is sent and the API
 * behaves as before. Server-only, like this whole module: never NEXT_PUBLIC.
 */
async function relayHeaders(): Promise<Record<string, string>> {
  const secret = process.env.API_RELAY_SECRET;
  if (!secret) return {};
  const address = (await headers()).get("x-real-ip")?.trim();
  if (!address || address.length > 45) return {};
  return { "X-Relay-Secret": secret, "X-Client-IP": address };
}

async function buildHeaders(
  isFormData: boolean,
  customHeaders: Record<string, string> | undefined,
  cacheable: boolean,
): Promise<Record<string, string>> {
  const token = (await cookies()).get("accessToken")?.value;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Not on a cached read: the Data Cache keys entries by their headers, so
    // a per-visitor value would give every address an entry of its own.
    ...(cacheable ? {} : await relayHeaders()),
    ...customHeaders,
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

/** API-relative path (+ query) → absolute URL. Only API paths are accepted. */
function resolveUrl(path: string, query?: QueryParams) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    // A programming error, never user input: every caller passes a literal
    // API path. Refusing absolute URLs keeps this client from ever being
    // turned into a request proxy, even by a future careless caller.
    throw new Error(`baseApi only accepts API-relative paths, got "${path}"`);
  }
  const qs = query ? buildQuery(query) : "";
  const pathWithQuery = qs
    ? `${path}${path.includes("?") ? "&" : "?"}${qs}`
    : path;
  return {
    url: `${process.env.NEXT_PUBLIC_API_URL}/api/v1${pathWithQuery}`,
    pathWithQuery,
  };
}

function messageOf(payload: any, status: number): string {
  return (
    payload?.message ||
    payload?.errorMessages?.[0]?.message ||
    `Request failed with ${status}`
  );
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
    query,
    tag,
    headers: customHeaders,
    cacheFor,
    redirectOnUnauthorized = true,
    providerAuthPrefix,
    skipPaymentRedirect = false,
    skipRevalidate = false,
  } = options;

  const { url: fullUrl, pathWithQuery } = resolveUrl(url, query);
  const tags = tag === undefined ? [] : typeof tag === "string" ? [tag] : [...tag];
  const cacheable =
    method === "GET" && typeof cacheFor === "number" && cacheFor > 0;
  const startedAt = LOG_REQUESTS ? performance.now() : 0;

  let res: Response;
  try {
    res = await fetch(fullUrl, {
      method,
      headers: await buildHeaders(isFormData, customHeaders, cacheable),
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      // Live unless explicitly cached (see the module comment). The two
      // shapes never mix: `cache` together with `next.revalidate` is a
      // conflicting config Next warns about and resolves on its own.
      ...(cacheable
        ? { next: { revalidate: cacheFor, ...(tags.length ? { tags } : {}) } }
        : { cache: "no-store" as const }),
    });
  } catch {
    // 🌐 Network / server down / DNS errors land here
    if (LOG_REQUESTS) logRequest(method, pathWithQuery, "network-error", startedAt);
    return {
      success: false,
      message: SERVER_NOT_ACTIVE,
    } as T;
  }
  if (LOG_REQUESTS) logRequest(method, pathWithQuery, res.status, startedAt);

  // One read of the body serves every branch below (204 / non-JSON → null).
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (res.status === 401) {
    if (
      providerAuthPrefix &&
      typeof payload?.message === "string" &&
      payload.message.startsWith(providerAuthPrefix)
    ) {
      return {
        success: false,
        statusCode: 401,
        message: payload.message,
        errorMessages: payload?.errorMessages,
      } as T;
    }
    if (redirectOnUnauthorized) redirect("/session-expired");
    return {
      success: false,
      statusCode: 401,
      message: messageOf(payload, 401),
    } as T;
  }

  if (method !== "GET" && !res.ok) {
    // Global billing rule (billing guide §1): a write rejected with 402 means
    // the company is payment-blocked — land the user on the billing page with
    // the backend's message instead of leaving each caller to handle it.
    // GETs are exempt: the dashboard stays browsable during payment failure,
    // and the billing page's own reads must never redirect-loop.
    // `skipPaymentRedirect` exempts the checkout / payment-method actions —
    // they are the resolution path, so bouncing them here would strand a
    // part-confirmed payment (see the option's doc comment).
    if (res.status === 402 && !skipPaymentRedirect) {
      // Only roles the billing page admits go there, resolved as its gate
      // resolves them (one session read: shared with the render, or made on
      // this path alone inside an action). The gate bounced everyone else on
      // to /settings and the message was lost; they have no billing banner
      // either, as billing status is refused to them. They get the envelope,
      // worded for them, which the calling form shows like any failure.
      if (hasRole(MANAGEMENT_ROLES, (await getDecodedUser())?.role)) {
        const msg =
          typeof payload?.message === "string" ? payload.message : "";
        redirect(
          `${BILLING_URL}${msg ? `?blocked=${encodeURIComponent(msg)}` : ""}`,
        );
      }
      // The block code is top-level from the tracker gate (enforceEntitlement),
      // the first error's path from checkSubscriptionValidity.
      return {
        success: false,
        ...payload,
        statusCode: 402,
        message: paymentBlockedMessageForMember(
          payload?.code ?? payload?.errorMessages?.[0]?.path,
        ),
      } as T;
    }
    return {
      success: false,
      message: messageOf(payload, res.status),
      ...payload,
      statusCode: res.status,
    } as T;
  }

  if (!res.ok) {
    // Trello reports an unreadable stored token as 400 (not 401) with
    // "Trello access token is missing. Please reconnect the account." but the
    // contract says to treat it as connection lost — normalize it onto the
    // provider-401 envelope above so every caller branch behaves identically.
    if (
      providerAuthPrefix &&
      typeof payload?.message === "string" &&
      payload.message.startsWith(providerAuthPrefix) &&
      payload.message.includes("access token is missing")
    ) {
      return {
        success: false,
        statusCode: 401,
        message: payload.message,
        errorMessages: payload?.errorMessages,
      } as T;
    }
    return {
      success: false,
      statusCode: res.status,
      message: messageOf(payload, res.status),
      errorMessages: payload?.errorMessages,
    } as T;
  }

  // 🔄 A successful write revalidates its tags (see the module comment).
  if (method !== "GET" && !skipRevalidate) {
    for (const t of tags) {
      try {
        revalidateTag(t);
      } catch (error) {
        // Next 15 throws when this runs inside a render. Callers that fetch
        // during render should pass `skipRevalidate` (a POST-shaped read has
        // nothing to invalidate anyway) — but failing to refresh must never
        // take the page down with it, least of all a payment page.
        console.warn(`revalidateTag("${t}") skipped:`, error);
      }
    }
  }

  if (res.status === 204) return null as T;

  return payload as T;
}
