/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IResponse } from "@/types/type";

export const getEvents = async (query = {}): Promise<IResponse<any[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(`/events${queryString ? `?${queryString}` : ""}`, {
    tag: "events",
  });
};

export const refreshEvents = async (
  query = {},
): Promise<IResponse<any[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(`/events${queryString ? `?${queryString}` : ""}`, {
    tag: "events",
    cache: "no-cache",
  });
};

export const addEvent = async (data: any) => {
  return await baseApi(`/events`, {
    method: "POST",
    body: data,
    tag: "events",
    cache: "no-cache",
  });
};

export const rescheduleEvent = async ({
  id,
  data,
}: {
  id: number;
  data: any;
}) => {
  return await baseApi(`/events/${id}`, {
    method: "PATCH",
    body: data,
    tag: "events",
    cache: "no-cache",
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
    cache: "no-cache",
  });
};

export const cancelEvent = async (id: number) => {
  return await baseApi(`/events/${id}`, {
    method: "DELETE",
    tag: "events",
    cache: "no-cache",
  });
};
