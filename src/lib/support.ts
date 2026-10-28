/**
 * Browser-side support API client (requester surface, blueprint §8.3 as
 * built by step 2).
 *
 * Transport: every call goes to the same-origin relay
 * `src/app/api/support/tickets/[[...path]]/route.ts`, which attaches the
 * httpOnly `accessToken` cookie as a Bearer header and forwards to
 * `${NEXT_PUBLIC_API_URL}/api/v1/tickets/*`. The browser never sees the
 * token and never needs CORS; unlike a server action the request is
 * abortable (`AbortSignal`), runs in parallel with others and carries
 * custom headers (`Idempotency-Key`). Server components keep using the
 * server actions in `actions/support/action.ts` for their first paint.
 *
 * Results are a discriminated union (`SupportResult`), never a throw: UI
 * code branches on `ok` and reads `code` for the machine error codes the
 * API carries in `errorMessages[].message` (§8.1, §8.6).
 */

import type { IMeta } from "@/types/type";
import type {
  AttachmentUrlResult,
  CreateTicketPayload,
  FeedbackResult,
  MarkReadPayload,
  PostMessagePayload,
  PostMessageResult,
  ReopenDraft,
  SubmitFeedbackPayload,
  SupportCategory,
  TicketCounts,
  TicketListFilters,
  TicketRequesterDetail,
  TicketRequesterSummary,
} from "@/types/support";
import { isRecord, isStatus } from "@/lib/supportGuards";
import {
  SUPPORT_LIMITS,
  narrowAttachmentUrl,
  narrowCategories,
  narrowCounts,
  narrowFeedbackResult,
  narrowMeta,
  narrowPostMessageResult,
  narrowReopenDraft,
  narrowTicketDetail,
  narrowTicketList,
  ticketListFiltersSchema,
} from "@/zod/supportSchema";

/* ───────────────────────────── paths ───────────────────────────── */

export const SUPPORT_TICKETS_PATH = "/support/tickets";
export const SUPPORT_NEW_TICKET_PATH = "/support/tickets/new";
export const ticketHref = (id: number | string) => `${SUPPORT_TICKETS_PATH}/${id}`;

/** Same-origin relay root (see the route handler's allow-list). */
export const SUPPORT_RELAY_BASE = "/api/support/tickets";

/**
 * Href of the create form prefilled from a reopen-as-new draft (the
 * contract `newTicketDraftSearchSchema` parses on the other side).
 */
export const newTicketHref = (
  draft?: Partial<Pick<ReopenDraft, "title" | "category_id" | "reopened_from_id" | "reopened_from_display_number">>,
): string => {
  if (!draft) return SUPPORT_NEW_TICKET_PATH;
  const params = new URLSearchParams();
  if (draft.title) params.set("title", draft.title.slice(0, SUPPORT_LIMITS.TITLE_MAX));
  if (draft.category_id) params.set("category_id", String(draft.category_id));
  if (draft.reopened_from_id) params.set("reopened_from_id", String(draft.reopened_from_id));
  if (draft.reopened_from_display_number) {
    params.set("reopened_from_display_number", draft.reopened_from_display_number);
  }
  const query = params.toString();
  return query ? `${SUPPORT_NEW_TICKET_PATH}?${query}` : SUPPORT_NEW_TICKET_PATH;
};

/* ───────────────────────────── error codes (§8.6) ───────────────────────────── */

export const SUPPORT_ERROR_CODES = [
  "TICKET_CLOSED",
  "INVALID_TRANSITION",
  "FORBIDDEN",
  "CONCURRENT_UPDATE",
  "FEEDBACK_EXISTS",
  "FEEDBACK_NOT_ALLOWED",
  "INVALID_STATE",
  "IDEMPOTENCY_KEY_REUSED",
  "IDEMPOTENCY_KEY_INVALID",
  "CATEGORY_HIDDEN",
  "ATTACHMENT_INVALID",
  "TICKET_NOT_FOUND",
  "TICKET_BUSY",
  "BULK_LIMIT",
] as const;

export type SupportApiErrorCode = (typeof SUPPORT_ERROR_CODES)[number];

/** Client-side conditions, reported through the same `code` channel. */
export type SupportClientErrorCode =
  | "SESSION_EXPIRED"
  | "RATE_LIMITED"
  | "NETWORK"
  | "ABORTED"
  | "VALIDATION"
  | "NOT_FOUND";

export type SupportErrorCode = SupportApiErrorCode | SupportClientErrorCode;

export interface SupportFieldError {
  path: string;
  message: string;
}

export interface SupportOk<T> {
  ok: true;
  status: number;
  data: T;
  meta: IMeta | null;
  message: string;
  /** `Idempotent-Replayed: true` — the server answered from the stored first response. */
  replayed: boolean;
}

export interface SupportFail {
  ok: false;
  status: number;
  message: string;
  code: SupportErrorCode | null;
  errors: SupportFieldError[];
  /** the caller's AbortSignal fired; never show this one to the user */
  aborted: boolean;
  /**
   * The server's `Retry-After` (429 limiter / 503), in ms — null when it sent none. Callers hold
   * their Retry / Refresh until it elapses instead of re-hitting the limiter.
   */
  retryAfterMs: number | null;
}

export type SupportResult<T> = SupportOk<T> | SupportFail;

const isApiCode = (value: string): value is SupportApiErrorCode =>
  (SUPPORT_ERROR_CODES as readonly string[]).includes(value);

interface EnvelopeLike {
  success?: unknown;
  message?: unknown;
  errorMessages?: unknown;
  statusCode?: unknown;
  data?: unknown;
  meta?: unknown;
}

const fieldErrorsOf = (envelope: EnvelopeLike | null): SupportFieldError[] => {
  if (!envelope || !Array.isArray(envelope.errorMessages)) return [];
  return envelope.errorMessages
    .filter(isRecord)
    .map((entry) => ({
      path: typeof entry.path === "string" ? entry.path : "",
      message: typeof entry.message === "string" ? entry.message : "",
    }))
    .filter((entry) => entry.message.length > 0);
};

/**
 * The machine code of an error envelope: an `errorMessages[].message` that is
 * a known code, else a known code contained in `message` (the v1 wording).
 */
export const parseErrorCode = (
  envelope: EnvelopeLike | null | undefined,
): SupportApiErrorCode | null => {
  if (!envelope) return null;
  for (const entry of fieldErrorsOf(envelope)) {
    if (isApiCode(entry.message)) return entry.message;
  }
  if (typeof envelope.message === "string") {
    const hit = SUPPORT_ERROR_CODES.find((code) => (envelope.message as string).includes(code));
    if (hit) return hit;
  }
  return null;
};

/** "12 seconds" / "1 minute" / "3 minutes" — for a Retry-After wait. */
export const waitPhrase = (ms: number): string => {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  if (seconds < 60) return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
};

/**
 * `Retry-After` → ms: delta-seconds or an HTTP-date (RFC 9110 §10.2.3); anything else (or a wait
 * over an hour, which no support limiter sends) → null.
 */
export const parseRetryAfter = (value: string | null, now = Date.now()): number | null => {
  if (!value) return null;
  const trimmed = value.trim();
  let ms: number;
  if (/^\d{1,6}$/.test(trimmed)) ms = Number(trimmed) * 1000;
  else {
    const at = Date.parse(trimmed);
    if (!Number.isFinite(at)) return null;
    ms = at - now;
  }
  return ms > 0 && ms <= 3_600_000 ? ms : null;
};

/** A user-facing sentence for a failed result (never for an aborted one). */
export const supportErrorMessage = (
  result: SupportFail,
  fallback = "Something went wrong. Please try again.",
): string => {
  switch (result.code) {
    case "SESSION_EXPIRED":
      return "Your session has expired. Please sign in again.";
    case "RATE_LIMITED":
      return result.retryAfterMs && result.retryAfterMs > 0
        ? `Too many requests. Please try again in ${waitPhrase(result.retryAfterMs)}.`
        : "Too many requests. Please wait a moment and try again.";
    case "NETWORK":
      return "Server is not active. Please try again later.";
    case "TICKET_CLOSED":
      return "This ticket is closed. Open a new ticket if the issue returns.";
    case "FEEDBACK_EXISTS":
      return "You've already rated this ticket.";
    case "FEEDBACK_NOT_ALLOWED":
    case "INVALID_STATE":
      return "You can rate a ticket once it is resolved or closed.";
    case "TICKET_NOT_FOUND":
    case "NOT_FOUND":
      return "We couldn't find that ticket.";
    case "ATTACHMENT_INVALID":
      return "One of the attachments was rejected. Remove it and try again.";
    case "CATEGORY_HIDDEN":
      return "That category is no longer available. Pick another one.";
    case "CONCURRENT_UPDATE":
      return "This ticket just changed. We refreshed it — please try again.";
    case "TICKET_BUSY":
      return "The ticket is busy right now. Please try again in a moment.";
    case "IDEMPOTENCY_KEY_REUSED":
    case "IDEMPOTENCY_KEY_INVALID":
      return "That request could not be repeated. Please submit it again.";
    case "FORBIDDEN":
      return "You can't do that on this ticket.";
    case "VALIDATION":
      return result.errors[0]?.message || result.message || fallback;
    default:
      return result.message || fallback;
  }
};

/* ───────────────────────────── idempotency ───────────────────────────── */

/**
 * One key per SUBMISSION: generate it when the user presses Send/Create,
 * reuse it for every retry of that same submission (the server replays the
 * first answer), and drop it once the submission succeeded.
 */
export const newIdempotencyKey = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 fallback for very old WebViews.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/* ───────────────────────────── query strings ───────────────────────────── */

/**
 * Parses the list page's URL state (`?page&status&category&category_id&q`)
 * with the same bounds the API enforces; invalid values fall back silently.
 * Shared by the server page and the client so both agree on the defaults.
 */
export const parseTicketListFilters = (
  params: Record<string, string | string[] | number | undefined> | URLSearchParams,
): Required<Pick<TicketListFilters, "page" | "limit">> &
  Pick<TicketListFilters, "status" | "category" | "category_id" | "q"> => {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    const raw = params[key];
    if (Array.isArray(raw)) return raw[0];
    return raw === undefined ? undefined : String(raw);
  };
  const parsed = ticketListFiltersSchema.parse({
    page: get("page"),
    limit: get("limit"),
    status: get("status"),
    category: get("category"),
    category_id: get("category_id"),
    q: get("q"),
  });
  return {
    page: parsed.page,
    limit: parsed.limit,
    status: isStatus(parsed.status) ? parsed.status : undefined,
    category: parsed.category || undefined,
    category_id: parsed.category_id,
    q: parsed.q || undefined,
  };
};

/** `?page=1&limit=5&status=open…` — drops empty values; never encodes labels. */
export const buildTicketListQuery = (filters: TicketListFilters = {}): string => {
  const params = new URLSearchParams();
  const put = (key: string, value: string | number | undefined) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  };
  put("page", filters.page);
  put("limit", filters.limit);
  put("status", filters.status);
  put("category", filters.category);
  put("category_id", filters.category_id);
  put("q", filters.q?.trim().slice(0, SUPPORT_LIMITS.SEARCH_MAX));
  put("sort", filters.sort);
  put("dir", filters.dir);
  put("fields", filters.fields);
  const query = params.toString();
  return query ? `?${query}` : "";
};

/* ───────────────────────────── transport ───────────────────────────── */

export interface RequestOptions {
  signal?: AbortSignal;
  /** sent as `Idempotency-Key` (create / messages) */
  idempotencyKey?: string;
  /** keep the 401 on the caller instead of redirecting to /session-expired */
  noSessionRedirect?: boolean;
}

type Method = "GET" | "POST" | "DELETE";

let sessionRedirectInFlight = false;

/** Mirrors `baseApi`'s 401 rule for browser calls. */
export const redirectToSessionExpired = () => {
  if (typeof window === "undefined" || sessionRedirectInFlight) return;
  sessionRedirectInFlight = true;
  window.location.assign("/session-expired");
};

const fail = (
  status: number,
  message: string,
  code: SupportErrorCode | null,
  errors: SupportFieldError[] = [],
  aborted = false,
  retryAfterMs: number | null = null,
): SupportFail => ({ ok: false, status, message, code, errors, aborted, retryAfterMs });

async function request<T>(
  method: Method,
  path: string,
  options: RequestOptions & { body?: unknown; narrow: (raw: unknown) => T | null },
): Promise<SupportResult<T>> {
  const { signal, idempotencyKey, noSessionRedirect, body, narrow } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  let response: Response;
  try {
    response = await fetch(`${SUPPORT_RELAY_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
      return fail(0, "Request cancelled", "ABORTED", [], true);
    }
    return fail(0, "Server is not active. Please try again later.", "NETWORK");
  }

  let envelope: EnvelopeLike | null = null;
  try {
    const parsed: unknown = await response.json();
    envelope = isRecord(parsed) ? (parsed as EnvelopeLike) : null;
  } catch {
    envelope = null;
  }

  const message =
    (envelope && typeof envelope.message === "string" && envelope.message) ||
    `Request failed with ${response.status}`;

  if (response.status === 401) {
    if (!noSessionRedirect) redirectToSessionExpired();
    return fail(401, message, "SESSION_EXPIRED", fieldErrorsOf(envelope));
  }
  if (response.status === 429) {
    return fail(429, message, "RATE_LIMITED", fieldErrorsOf(envelope), false, parseRetryAfter(response.headers.get("retry-after")));
  }
  if (!response.ok || !envelope || envelope.success !== true) {
    const code =
      parseErrorCode(envelope) ??
      (response.status === 404 ? "NOT_FOUND" : response.status === 400 ? "VALIDATION" : null);
    const retryAfterMs = response.status === 503 ? parseRetryAfter(response.headers.get("retry-after")) : null;
    return fail(response.status, message, code, fieldErrorsOf(envelope), false, retryAfterMs);
  }

  const data = narrow(envelope.data);
  if (data === null) {
    return fail(response.status, "Unexpected response from the server.", "VALIDATION");
  }

  return {
    ok: true,
    status: response.status,
    data,
    meta: envelope.meta === undefined || envelope.meta === null ? null : narrowMeta(envelope.meta),
    message,
    replayed: response.headers.get("idempotent-replayed") === "true",
  };
}

/** `data: null` endpoints (read marks, v2 deletes): success is the envelope's `success: true`. */
const nullData = (): true => true;

/* ───────────────────────────── endpoints (§8.3) ───────────────────────────── */

export const supportApi = {
  /** `GET /tickets` — own tickets, newest first, `limit` default 5. */
  listTickets(filters: TicketListFilters = {}, options: RequestOptions = {}) {
    return request<TicketRequesterSummary[]>("GET", buildTicketListQuery(filters), {
      ...options,
      narrow: narrowTicketList,
    });
  },

  /** `GET /tickets/counts` — the hero card and status-dropdown counts (global for the user). */
  getCounts(options: RequestOptions = {}) {
    return request<TicketCounts>("GET", "/counts", { ...options, narrow: narrowCounts });
  },

  /** `GET /tickets/categories` — visible categories in sort order (cached 300 s server-side). */
  getCategories(options: RequestOptions = {}) {
    return request<SupportCategory[]>("GET", "/categories", {
      ...options,
      narrow: narrowCategories,
    });
  },

  /** `GET /tickets/:id` (+ `?before=` for older thread pages). 404 when not the owner. */
  getTicket(id: number, options: RequestOptions & { before?: number } = {}) {
    const { before, ...rest } = options;
    const query = before ? `?before=${encodeURIComponent(String(before))}` : "";
    return request<TicketRequesterDetail>("GET", `/${id}${query}`, {
      ...rest,
      narrow: narrowTicketDetail,
    });
  },

  /** `POST /tickets` — 201 with the full detail. Pass the same `idempotencyKey` on retries. */
  createTicket(payload: CreateTicketPayload, options: RequestOptions = {}) {
    return request<TicketRequesterDetail>("POST", "", {
      ...options,
      body: payload,
      narrow: narrowTicketDetail,
    });
  },

  /** `POST /tickets/:id/messages` — 201 `{ message, ticket (patch), toast }`. 409 TICKET_CLOSED. */
  postMessage(id: number, payload: PostMessagePayload, options: RequestOptions = {}) {
    return request<PostMessageResult>("POST", `/${id}/messages`, {
      ...options,
      body: payload,
      narrow: narrowPostMessageResult,
    });
  },

  /** `POST /tickets/:id/read` — read receipt (throttled server-side); `data: null`. */
  markRead(id: number, payload: MarkReadPayload, options: RequestOptions = {}) {
    return request<true>("POST", `/${id}/read`, {
      ...options,
      body: payload,
      narrow: nullData,
    });
  },

  /** `POST /tickets/:id/feedback` — once, on resolved/closed. 409 FEEDBACK_EXISTS, 422 FEEDBACK_NOT_ALLOWED. */
  submitFeedback(id: number, payload: SubmitFeedbackPayload, options: RequestOptions = {}) {
    return request<FeedbackResult>("POST", `/${id}/feedback`, {
      ...options,
      body: payload,
      narrow: narrowFeedbackResult,
    });
  },

  /** `POST /tickets/:id/reopen-as-new` — a prefilled draft for the create modal. */
  reopenAsNew(id: number, options: RequestOptions = {}) {
    return request<ReopenDraft>("POST", `/${id}/reopen-as-new`, {
      ...options,
      body: {},
      narrow: narrowReopenDraft,
    });
  },

  /** `DELETE /tickets/attachments/:id` — own pending uploads only; `data: null`. */
  deletePendingAttachment(attachmentId: number, options: RequestOptions = {}) {
    return request<true>("DELETE", `/attachments/${attachmentId}`, {
      ...options,
      narrow: nullData,
    });
  },

  /** v1 alias `GET /tickets/attachments/url?key=` — a fresh 15-minute signed URL. */
  getAttachmentUrl(key: string, options: RequestOptions = {}) {
    return request<AttachmentUrlResult>(
      "GET",
      `/attachments/url?key=${encodeURIComponent(key)}`,
      { ...options, narrow: narrowAttachmentUrl },
    );
  },
};

