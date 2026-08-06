"use server";

import {
    IResponse,
    SlackStatusResponse,
    SlackWorkspaceSettings,
} from "@/types/type";
import { baseApi } from "../baseApi";

/**
 * Slack is a messaging surface, not a project-management provider (slack
 * spec §1): there are no boards/import/sync endpoints and /slack/status
 * returns a two-section { workspace, personal } payload instead of the flat
 * provider shape — so Slack lives outside the generic PROVIDERS family in
 * appIntegrationAction.ts and gets its own thin actions here.
 *
 * `providerAuthPrefix` follows the base-spec provider-401 rule: a 401 whose
 * message starts with "Slack" means Slack revoked a token, not that the app
 * session expired — baseApi returns the envelope instead of logging out.
 */
const BASE = "/slack";
const TAG = "slack-integration";
const AUTH_PREFIX = "Slack";

export const getSlackStatus = async (): Promise<
    IResponse<SlackStatusResponse>
> =>
    await baseApi(`${BASE}/status`, {
        tag: TAG,
        cache: "no-cache",
        providerAuthPrefix: AUTH_PREFIX,
    });

/** Admin only — 201, `data` is the workspace authorize URL (§2.1). */
export const getSlackWorkspaceAuthUrl = async (): Promise<IResponse<string>> =>
    await baseApi(`${BASE}/connect`, {
        tag: TAG,
        cache: "no-cache",
        providerAuthPrefix: AUTH_PREFIX,
    });

/**
 * Any member — 201, `data` is the personal authorize URL pinned to the
 * company workspace (§2.2). 400 when no workspace is connected yet — the UI
 * gates the CTA on `workspace.connected` so members never hit it.
 */
export const getSlackPersonalAuthUrl = async (): Promise<IResponse<string>> =>
    await baseApi(`${BASE}/connect/personal`, {
        tag: TAG,
        cache: "no-cache",
        providerAuthPrefix: AUTH_PREFIX,
    });

/**
 * Admin only. NOT idempotent — 400 "Slack workspace is not connected" unless
 * `workspace.connected` (§2.5). Members' personal rows survive it.
 */
export const disconnectSlackWorkspace = async (): Promise<
    IResponse<SlackStatusResponse>
> =>
    await baseApi(`${BASE}/disconnect`, {
        method: "DELETE",
        tag: TAG,
        cache: "no-cache",
        providerAuthPrefix: AUTH_PREFIX,
    });

/** Any member — 400 "Your Slack account is not connected" when nothing to drop (§2.6). */
export const disconnectSlackPersonal = async (): Promise<
    IResponse<SlackStatusResponse>
> =>
    await baseApi(`${BASE}/disconnect/personal`, {
        method: "DELETE",
        tag: TAG,
        cache: "no-cache",
        providerAuthPrefix: AUTH_PREFIX,
    });

/**
 * Admin only — every field optional but at least one required (§2.7).
 * On success `data.settings` is the full resolved settings object.
 */
export const updateSlackSettings = async (
    payload: Partial<SlackWorkspaceSettings>,
): Promise<IResponse<{ settings: SlackWorkspaceSettings }>> =>
    await baseApi(`${BASE}/settings`, {
        method: "PATCH",
        body: payload,
        tag: TAG,
        cache: "no-cache",
        providerAuthPrefix: AUTH_PREFIX,
    });

/** Any member — turning it off also clears an active "Tracking time" status (§2.8). */
export const updateSlackPersonalSettings = async (payload: {
    status_sync: boolean;
}): Promise<IResponse<{ status_sync: boolean }>> =>
    await baseApi(`${BASE}/settings/personal`, {
        method: "PATCH",
        body: payload,
        tag: TAG,
        cache: "no-cache",
        providerAuthPrefix: AUTH_PREFIX,
    });
