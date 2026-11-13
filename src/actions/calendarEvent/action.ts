/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { baseApi } from "../baseApi";
import type { QueryParams } from "@/utils/buildQuery";
import { IResponse } from "@/types/type";

/**
 * One month of events. The API buckets months in the signed-in user's own
 * time zone, so `year`/`month` must be that zone's calendar month — never one
 * derived from a UTC (or server-local) timestamp.
 *
 * The event drawer's sync poll reads the same endpoint through the
 * `/event/live` route handler instead of this action: a poll must not hold
 * the tab's one-at-a-time server-action queue.
 */
export const getEvents = async (query: {
    year: number | string;
    month: number | string;
}): Promise<IResponse<any[]>> => {
    return await baseApi(`/events`, {
        query,
        tag: "events",
    });
};

export const addEvent = async (data: any
    //     {
    //     type: string;
    //     start_date: string;
    //     end_date: string;
    //     reason: string;
    // }
) => {
    return await baseApi(`/events`, {
        method: "POST",
        body: data,
        tag: "events",
    });
};

export const rescheduleEvent = async ({ id, data }: { id: number, data: any }) => {
    return await baseApi(`/events/${id}`, {
        method: "PATCH",
        body: data,
        tag: "events",
    });
};

export const addEventMembers = async (data: {
  event_id: number;
  member_ids: number[];
  force_create?: boolean;
}) => {
  return await baseApi(`/events`, {
    method: "PATCH",
    body: data,
    tag: "events",
  });
};

export const cancelEvent = async (id: number) => {
  return await baseApi(`/events/${id}`, {
    method: "DELETE",
    tag: "events",
  });
};

export const getMembersEventDropdown = async (query: QueryParams = {}): Promise<
  IResponse<{ id: number; name: string; email: string; image: string }[]>> => {
  return await baseApi(`/events/dropdown/users`, { query });
};