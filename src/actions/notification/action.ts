/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { IResponse } from "@/types/type";
import { baseApi } from "../baseApi";
import type { QueryParams } from "@/utils/buildQuery";

export const getNotifications = async (query: QueryParams = {}): Promise<IResponse<any>> => {
    return await baseApi(`/notifications`, {
        query,
        tag: "notifications",
    });
};

export const getNotificationsCount = async (query: QueryParams = {}): Promise<IResponse<any>> => {
    return await baseApi(`/notifications/counts`, {
        query,
        tag: "notifications",
    });
};

/**
 * `revalidate: false` skips the full-route re-render a tagged write triggers.
 * Only /notification renders read-state on the server; the header bell's list
 * and badge are socket-fed client state, so marking from the bell anywhere
 * else would re-render (and re-read) the whole page for nothing.
 */
export const readNotifications = async ({
    data,
    revalidate = true,
}: {
    data: { ids: number[] };
    revalidate?: boolean;
}) => {
    return await baseApi(`/notifications/update-read-status`, {
        method: "PATCH",
        body: data,
        tag: "notifications",
        skipRevalidate: !revalidate,
    });
};

/**
 * Marks every unread notification of the signed-in user as read, in one write:
 * the API runs a single UPDATE, so none is missed however many there are, and
 * one that arrives meanwhile stays unread. Tagged like `readNotifications`, so
 * /notification re-renders with fresh counts; the header bell gets the new
 * unread list over its socket.
 *
 * `type` is the list's Subject filter: with one selected, only that subject's
 * unread notifications are marked, never the ones the filter keeps off the
 * screen. Without it (or "all") no body is sent and every subject is marked.
 * A server action's argument is whatever the caller sends, so only a string
 * is forwarded; the API validates it against the list's own subjects.
 */
export const readAllNotifications = async (
    type?: string,
): Promise<IResponse<{ count: number }>> => {
    return await baseApi(`/notifications/read-all`, {
        method: "PATCH",
        body: typeof type === "string" && type && type !== "all" ? { type } : undefined,
        tag: "notifications",
    });
};
