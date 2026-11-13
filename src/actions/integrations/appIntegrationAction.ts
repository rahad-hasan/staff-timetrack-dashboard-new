"use server";

import { APP_UPDATED_MESSAGE } from "@/lib/appUpdated";
import {
    IntegrationItem,
    IntegrationStatusResponse,
    IResponse,
} from "@/types/type";
import { unstable_rethrow } from "next/navigation";
import { baseApi } from "../baseApi";
import { isProviderKey, providerConfig } from "./providers";
import { getSlackStatus } from "./slackIntegrationAction";

/*
 * Connection and picker actions for the project-management integrations
 * (providers.ts holds the whitelist and the wire-format adapters).
 *
 * No cache tags: every read here is live and lands in client state that the
 * detail view re-reads itself after each write. Import and sync are not
 * here: a run takes minutes and Next runs a tab's server actions one at a
 * time, so they are route handlers (lib/server/integrationRun.ts). The two
 * exports at the end only answer tabs loaded before that move.
 */

/* ---------------- generic (same endpoint family for every provider) ---------------- */

export const getIntegrationStatus = async (
    provider: string,
): Promise<IResponse<IntegrationStatusResponse>> => {
    const { base, authPrefix } = providerConfig(provider);
    return await baseApi(`${base}/status`, {
        providerAuthPrefix: authPrefix,
    });
};

/**
 * Every hub chip's status in ONE server action.
 *
 * The hub used to call `getIntegrationStatus` / `getSlackStatus` once per
 * provider from the browser inside a `Promise.all` — but Next runs a tab's
 * server actions one at a time, so that was six sequential browser → Next →
 * API round trips on every hub visit, holding up any click made meanwhile.
 * Here the reads run in parallel on the server and come back as one map.
 *
 * `providers` is client input: unknown keys are ignored. A provider whose
 * read fails is absent from the map, so its chip falls back to "Not
 * connected" exactly as before. Slack's two-section status is reduced to the
 * company workspace connection — what the admin-facing chip shows.
 */
export const getIntegrationStatuses = async (
    providers: string[],
): Promise<Record<string, IntegrationStatusResponse>> => {
    const keys = Array.isArray(providers)
        ? [...new Set(providers)].filter(
              (key) => key === "slack" || isProviderKey(key),
          )
        : [];

    const entries = await Promise.all(
        keys.map(
            async (key): Promise<[string, IntegrationStatusResponse] | null> => {
                try {
                    if (key === "slack") {
                        const res = await getSlackStatus();
                        const workspace = res?.data?.workspace;
                        if (!workspace) return null;
                        return [
                            key,
                            {
                                provider: "slack",
                                type: "messaging",
                                status: workspace.status,
                                connected: workspace.connected === true,
                            },
                        ];
                    }
                    const res = await getIntegrationStatus(key);
                    return res?.data ? [key, res.data] : null;
                } catch (error) {
                    // A dead session must still reach /session-expired;
                    // anything else costs only this provider's chip.
                    unstable_rethrow(error);
                    return null;
                }
            },
        ),
    );

    return Object.fromEntries(
        entries.filter(
            (entry): entry is [string, IntegrationStatusResponse] =>
                entry !== null,
        ),
    );
};

export const getIntegrationAuthUrl = async (
    provider: string,
): Promise<IResponse<string>> => {
    const { base, authPrefix } = providerConfig(provider);
    return await baseApi(`${base}/connect`, {
        providerAuthPrefix: authPrefix,
    });
};

/**
 * Answers with the provider's post-disconnect status (the same serializer as
 * `/status`), which the detail view applies directly. Untagged: nothing
 * server-rendered shows a connection, so a route re-render would buy nothing.
 */
export const disconnectIntegration = async (
    provider: string,
): Promise<IResponse<IntegrationStatusResponse>> => {
    const { base, authPrefix } = providerConfig(provider);
    return await baseApi(`${base}/disconnect`, {
        method: "DELETE",
        providerAuthPrefix: authPrefix,
    });
};

/* -------- item-picker family (§9: same endpoint family per provider) -------- */

export const getIntegrationItems = async (
    provider: string,
): Promise<IResponse<IntegrationItem[]>> => {
    const { base, authPrefix, itemsPath, toItem } = providerConfig(provider);
    const res = await baseApi<IResponse<never[]>>(`${base}${itemsPath}`, {
        providerAuthPrefix: authPrefix,
    });
    if (res?.success) {
        // tolerate a malformed success envelope — the UI expects an array
        return {
            ...res,
            data: Array.isArray(res.data) ? res.data.map(toItem) : [],
        };
    }
    return res as unknown as IResponse<IntegrationItem[]>;
};

/* -------- removed: import and sync, for tabs loaded before the move -------- */

/**
 * DEPRECATED: delete in the release after the one that moved import and sync
 * to route handlers.
 *
 * A tab loaded before that deploy runs the old view, which still calls these
 * two by action id. With no such action Next answers "Server action not
 * found", and that view toasted a run that "will finish on the server". These
 * run nothing and answer at once, in an envelope the old view toasts as it is
 * (not a 401, no "already running" or "not connected" in the message).
 *
 * An action id hashes this file's absolute path, the export name and the
 * build's server-actions key (.next/cache/.rscinfo, renewed after 14 days),
 * not an arrow export's parameters. So these reach an old tab only when the
 * new build runs in the same directory and keeps that key.
 */
const RUN_MOVED: IResponse<null> = {
    success: false,
    statusCode: 410,
    message: APP_UPDATED_MESSAGE,
    data: null,
};

export const importIntegrationItems = async () => RUN_MOVED;

export const syncIntegration = async () => RUN_MOVED;
