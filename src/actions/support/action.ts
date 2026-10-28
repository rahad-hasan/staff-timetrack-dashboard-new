"use server";

import { baseApi } from "../baseApi";
import { buildQuery } from "@/utils/buildQuery";
import { IResponse } from "@/types/type";
import {
  narrowCategories,
  narrowCounts,
  narrowMeta,
  narrowTicketDetail,
  narrowTicketList,
} from "@/zod/supportSchema";
import type {
  SupportCategory,
  TicketCounts,
  TicketListFilters,
  TicketRequesterDetail,
  TicketRequesterSummary,
} from "@/types/support";

/**
 * Server actions for the support pages.
 *
 * Decision (step 9a, foundation): server components fetch their FIRST PAINT
 * through these (`getTickets`, `getTicketCounts`, `getSupportCategories`,
 * `getTicketById`) — the app's convention (`baseApi`, cookie token, 401 →
 * /session-expired) and no client waterfall. Every INTERACTIVE call
 * (search-as-you-type, pagination, create, reply, read receipts, feedback,
 * socket-driven refetches) goes through the browser client in
 * `lib/support.ts` instead: server actions are queued one at a time by
 * Next, cannot be aborted and cannot carry an `Idempotency-Key`. There are
 * no support mutations here (the v1 ones were removed with the v1
 * components, step 9a integration).
 */

const TICKETS_TAG = "support-tickets";
const COUNTS_TAG = "support-ticket-counts";
const CATEGORIES_TAG = "support-categories";
const ticketTag = (id: number | string) => `support-ticket-${id}`;

/** A first-paint read: `data` exists — narrowed — only on success. */
export type SupportEnvelope<T> =
  | (Omit<IResponse<T>, "success"> & { success: true })
  | {
      success: false;
      statusCode?: number;
      message: string;
      data?: undefined;
      meta?: undefined;
      errorMessages?: IResponse<unknown>["errorMessages"];
    };

/**
 * Boundary narrowing for the first-paint reads (house rule: API responses
 * are narrowed before use). A success envelope whose `data` fails the
 * schema becomes a failure envelope, so a page renders its error state
 * instead of crashing on a missing field.
 */
const narrowEnvelope = <T,>(
  response: IResponse<unknown> | null | undefined,
  narrow: (raw: unknown) => T | null,
): SupportEnvelope<T> => {
  if (!response) return { success: false, message: "Server is not active. Please try again later." };
  if (response.success !== true) {
    return {
      success: false,
      statusCode: response.statusCode,
      message: response.message,
      errorMessages: response.errorMessages,
    };
  }
  const data = narrow(response.data);
  if (data === null) {
    return { success: false, statusCode: response.statusCode, message: "Unexpected response from the server." };
  }
  const meta = response.meta ? (narrowMeta(response.meta) ?? undefined) : undefined;
  return { ...response, success: true, data, meta };
};

/** `GET /tickets` — own tickets, newest first (default limit 5, REQ-U-06). */
export const getTickets = async (
  query: TicketListFilters = {},
): Promise<SupportEnvelope<TicketRequesterSummary[]>> => {
  const queryString = buildQuery(query as Record<string, string | number | undefined>);
  const response = await baseApi<IResponse<unknown>>(
    `/tickets${queryString ? `?${queryString}` : ""}`,
    {
      tag: TICKETS_TAG,
      cache: "no-cache",
    },
  );
  return narrowEnvelope(response, narrowTicketList);
};

/** `GET /tickets/counts` — hero card + status dropdown counts (global for the user). */
export const getTicketCounts = async (): Promise<SupportEnvelope<TicketCounts>> => {
  const response = await baseApi<IResponse<unknown>>(`/tickets/counts`, {
    tag: COUNTS_TAG,
    cache: "no-cache",
  });
  return narrowEnvelope(response, narrowCounts);
};

/** `GET /tickets/categories` — visible categories in sort order. */
export const getSupportCategories = async (): Promise<SupportEnvelope<SupportCategory[]>> => {
  const response = await baseApi<IResponse<unknown>>(`/tickets/categories`, {
    tag: CATEGORIES_TAG,
    cache: "no-cache",
  });
  return narrowEnvelope(response, narrowCategories);
};

/** `GET /tickets/:id` — the latest thread page (older pages: `supportApi.getTicket(id, { before })`). Not the owner → 404 (anti-enumeration). */
export const getTicketById = async (id: number | string): Promise<SupportEnvelope<TicketRequesterDetail>> => {
  const response = await baseApi<IResponse<unknown>>(`/tickets/${id}`, {
    tag: ticketTag(id),
    cache: "no-cache",
  });
  return narrowEnvelope(response, narrowTicketDetail);
};
