"use server";

import { revalidateTag } from "next/cache";
import { baseApi } from "../baseApi";
import { buildQuery } from "@/utils/buildQuery";
import { IResponse } from "@/types/type";
import {
  CreateReplyPayload,
  CreateTicketPayload,
  SubmitFeedbackPayload,
  TicketConversation,
  TicketDetail,
  TicketFeedback,
  TicketListFilters,
  TicketListItem,
} from "@/types/support";

const TICKETS_TAG = "support-tickets";
const ticketTag = (id: number | string) => `support-ticket-${id}`;

export const createTicket = async (
  data: CreateTicketPayload,
): Promise<IResponse<TicketDetail>> => {
  const response = await baseApi<IResponse<TicketDetail>>(`/tickets`, {
    method: "POST",
    body: data,
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateTag(TICKETS_TAG);
  }

  return response;
};

export const getTickets = async (
  query: TicketListFilters = {},
): Promise<IResponse<TicketListItem[]>> => {
  const queryString = buildQuery(query as Record<string, string | number | undefined>);
  return await baseApi<IResponse<TicketListItem[]>>(
    `/tickets${queryString ? `?${queryString}` : ""}`,
    {
      tag: TICKETS_TAG,
      cache: "no-cache",
    },
  );
};

export const getTicketById = async (
  id: number | string,
): Promise<IResponse<TicketDetail>> => {
  return await baseApi<IResponse<TicketDetail>>(`/tickets/${id}`, {
    tag: ticketTag(id),
    cache: "no-cache",
  });
};

export const postTicketReply = async (
  ticketId: number | string,
  data: CreateReplyPayload,
): Promise<IResponse<TicketConversation>> => {
  const response = await baseApi<IResponse<TicketConversation>>(
    `/tickets/${ticketId}/conversations`,
    {
      method: "POST",
      body: data,
      cache: "no-cache",
    },
  );

  if (response?.success) {
    revalidateTag(ticketTag(ticketId));
    revalidateTag(TICKETS_TAG);
  }

  return response;
};

/**
 * Removes an uploaded-but-unsent attachment (the "x" on a pending chip).
 * The API refuses (409) once the key is part of a ticket or message, so a
 * failure here is never worth surfacing — the chip is gone either way.
 */
export const deleteTicketAttachment = async (
  key: string,
): Promise<IResponse<{ key: string; deleted: boolean }>> => {
  return await baseApi<IResponse<{ key: string; deleted: boolean }>>(
    `/tickets/attachments`,
    {
      method: "DELETE",
      body: { key },
      cache: "no-cache",
    },
  );
};

export const submitTicketFeedback = async (
  ticketId: number | string,
  data: SubmitFeedbackPayload,
): Promise<IResponse<TicketFeedback>> => {
  const response = await baseApi<IResponse<TicketFeedback>>(
    `/tickets/${ticketId}/feedback`,
    {
      method: "POST",
      body: data,
      cache: "no-cache",
    },
  );

  if (response?.success) {
    revalidateTag(ticketTag(ticketId));
    revalidateTag(TICKETS_TAG);
  }

  return response;
};
