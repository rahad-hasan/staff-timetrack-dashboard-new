/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
    getIntegrationAuthUrl,
    getIntegrationStatus,
} from "@/actions/integrations/appIntegrationAction";
import { actionErrorMessage } from "@/lib/actionErrors";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
    INTEGRATION_CALLBACK_MESSAGE_TYPE,
    IntegrationDef,
} from "./registry";

const CLOSED_POLL_INTERVAL_MS = 1000;
const STATUS_POLL_INTERVAL_MS = 3000;
const SAFETY_TIMEOUT_MS = 10 * 60 * 1000;

export type ConnectFlowOutcome = "success" | "failed" | "closed";

/**
 * Escape hatches for providers outside the generic PROVIDERS family. Slack
 * runs two flows off one provider key (workspace §2.1 / personal §2.2), each
 * with its own auth-url endpoint and its own section of the two-part
 * /slack/status payload; the calendar connections (Google, Microsoft) have
 * endpoints of their own entirely — the defaults below cover every flat
 * provider.
 */
export interface ConnectFlowOverrides {
    /** replaces `getIntegrationAuthUrl(def.key)` */
    getAuthUrl?: () => Promise<any>;
    /** replaces the default `status.data.connected === true` probe used by
     *  the popup-closed and while-open polls */
    checkConnected?: () => Promise<boolean>;
    /** popup window name — two concurrent flows of one provider must differ */
    windowName?: string;
    /**
     * success toast text — default `${def.name} connected`. A function gets
     * the connected account's email when the callback page reported one.
     */
    successToast?: string | ((providerEmail: string | null) => string);
    /**
     * The browser refused the popup. Default: `popupBlocked` turns true for
     * the caller to explain; a caller with nowhere to say so can instead
     * continue in this tab (navigate to `url`).
     */
    onPopupBlocked?: (url: string) => void;
}

/**
 * What the flow needs to know about a provider: the `key` the callback page
 * posts back (and the generic endpoints are addressed by) and a display name.
 * Registry entries satisfy it; the calendar connections pass just these.
 */
export type ConnectFlowProvider = Pick<IntegrationDef, "name"> & { key: string };

/**
 * OAuth-popup connect flow shared by every app integration (§6.1 of the spec):
 * the popup lands on the backend callback page which posts
 * `{ type, provider, success }` to window.opener. Primary signal is that
 * postMessage; fallbacks are a popup-closed poll (silent status refetch) and
 * a 3s status poll while the popup is open (covers browsers that block
 * opener messaging).
 */
export const useIntegrationConnectFlow = (
    def: ConnectFlowProvider,
    onFinished?: (outcome: ConnectFlowOutcome) => void,
    overrides?: ConnectFlowOverrides,
) => {
    const [busy, setBusy] = useState(false);
    const [popupBlocked, setPopupBlocked] = useState(false);

    const popupRef = useRef<Window | null>(null);
    const closedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const messageHandlerRef = useRef<((e: MessageEvent) => void) | null>(null);
    const settledRef = useRef(false);
    /** a status probe is in flight — the polls never stack a second one */
    const probingRef = useRef(false);
    const onFinishedRef = useRef(onFinished);
    onFinishedRef.current = onFinished;
    const overridesRef = useRef(overrides);
    overridesRef.current = overrides;

    const cleanup = useCallback(() => {
        if (closedTimerRef.current) {
            clearInterval(closedTimerRef.current);
            closedTimerRef.current = null;
        }
        if (statusTimerRef.current) {
            clearInterval(statusTimerRef.current);
            statusTimerRef.current = null;
        }
        if (safetyTimerRef.current) {
            clearTimeout(safetyTimerRef.current);
            safetyTimerRef.current = null;
        }
        if (messageHandlerRef.current) {
            window.removeEventListener("message", messageHandlerRef.current);
            messageHandlerRef.current = null;
        }
    }, []);

    // remove listeners/timers if the view unmounts mid-flow — and mark the
    // flow settled, so a status probe still in flight cannot toast or call
    // back into a view that is gone (`start` re-arms it)
    useEffect(
        () => () => {
            settledRef.current = true;
            cleanup();
        },
        [cleanup],
    );

    const settle = useCallback(
        (
            outcome: ConnectFlowOutcome,
            {
                silent = false,
                providerEmail = null,
            }: { silent?: boolean; providerEmail?: string | null } = {},
        ) => {
            if (settledRef.current) return;
            settledRef.current = true;
            cleanup();
            // A failed sign-in keeps its window: the callback page there is
            // the only place that says WHY (consent denied, account linked
            // elsewhere, …) and it has a close button of its own. Every other
            // outcome closes it — the callback page does NOT close itself.
            if (outcome !== "failed") {
                try {
                    popupRef.current?.close();
                } catch {
                    // ignore cross-origin close errors
                }
            }
            popupRef.current = null;
            setBusy(false);
            if (!silent) {
                if (outcome === "success") {
                    const custom = overridesRef.current?.successToast;
                    toast.success(
                        typeof custom === "function"
                            ? custom(providerEmail)
                            : (custom ?? `${def.name} connected`),
                    );
                } else if (outcome === "failed") {
                    // the specific reason is on the callback page, left open
                    // above — the payload carries none, so keep this neutral
                    toast.message("Connection was not completed");
                }
            }
            onFinishedRef.current?.(outcome);
        },
        [cleanup, def.name],
    );

    const start = useCallback(async () => {
        if (busy) return;
        setPopupBlocked(false);
        settledRef.current = false;
        setBusy(true);
        try {
            const res: any = overridesRef.current?.getAuthUrl
                ? await overridesRef.current.getAuthUrl()
                : await getIntegrationAuthUrl(def.key);
            const url = typeof res?.data === "string" && res.data.startsWith("http")
                ? res.data
                : null;
            if (!url) {
                setBusy(false);
                const message: string = res?.message || "";
                // OAuth2 providers say "<name> OAuth configuration is missing",
                // Trello says "Trello API configuration is missing" (§6)
                if (message.includes("configuration is missing")) {
                    toast.error(
                        "Integration is not configured on the server — please contact support.",
                    );
                } else {
                    toast.error(message || `Could not start ${def.name} sign-in`);
                }
                return;
            }

            // The view went away while the auth URL was on its way (the
            // unmount cleanup marked the flow settled). Nothing below could
            // ever be torn down again — every teardown goes through `settle`,
            // which is a no-op once settled — so open and install nothing.
            if (settledRef.current) {
                setBusy(false);
                return;
            }

            const popup = window.open(
                url,
                overridesRef.current?.windowName ?? `${def.key}-oauth`,
                "width=620,height=760,menubar=no,toolbar=no,resizable=yes,scrollbars=yes",
            );
            if (!popup) {
                setBusy(false);
                const onPopupBlocked = overridesRef.current?.onPopupBlocked;
                if (onPopupBlocked) onPopupBlocked(url);
                else setPopupBlocked(true);
                return;
            }
            popupRef.current = popup;
            try {
                // a failed attempt's window may still be open under this name:
                // it is reused (navigated) but not raised, so bring it forward
                popup.focus();
            } catch {
                // best effort
            }

            const handleMessage = (event: MessageEvent) => {
                const data = event.data;
                if (
                    data?.type !== INTEGRATION_CALLBACK_MESSAGE_TYPE ||
                    data?.provider !== def.key
                ) {
                    return;
                }
                settle(data?.success === true ? "success" : "failed", {
                    providerEmail:
                        typeof data?.providerEmail === "string"
                            ? data.providerEmail
                            : null,
                });
            };
            messageHandlerRef.current = handleMessage;
            window.addEventListener("message", handleMessage);

            const probeConnected = async () => {
                const checkConnected = overridesRef.current?.checkConnected;
                if (checkConnected) return await checkConnected();
                const status: any = await getIntegrationStatus(def.key);
                const payload = status?.data ?? status;
                return payload?.connected === true;
            };

            closedTimerRef.current = setInterval(async () => {
                if (settledRef.current) return;
                if (popupRef.current?.closed) {
                    // popup closed without a callback message — refetch status
                    // once, silently (covers blocked opener messaging / user
                    // closing the window mid-consent)
                    if (closedTimerRef.current) {
                        clearInterval(closedTimerRef.current);
                        closedTimerRef.current = null;
                    }
                    try {
                        if (await probeConnected()) {
                            settle("success");
                            return;
                        }
                    } catch {
                        // ignore
                    }
                    settle("closed", { silent: true });
                }
            }, CLOSED_POLL_INTERVAL_MS);

            // poll status every 3s only while the connect popup is open. One
            // probe at a time: a probe is a server action, Next queues those,
            // and a slow API would otherwise pile up a backlog that keeps
            // firing after the flow has settled.
            statusTimerRef.current = setInterval(async () => {
                if (settledRef.current || popupRef.current?.closed) return;
                if (probingRef.current) return;
                probingRef.current = true;
                try {
                    if (await probeConnected()) {
                        settle("success");
                    }
                } catch {
                    // swallow while polling
                } finally {
                    probingRef.current = false;
                }
            }, STATUS_POLL_INTERVAL_MS);

            safetyTimerRef.current = setTimeout(() => {
                settle("closed", { silent: true });
            }, SAFETY_TIMEOUT_MS);
        } catch (err) {
            setBusy(false);
            toast.error(actionErrorMessage(err, `Could not start ${def.name} sign-in`));
        }
    }, [busy, def.key, def.name, settle]);

    return { start, busy, popupBlocked };
};
