/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
    getIntegrationAuthUrl,
    getIntegrationStatus,
} from "@/actions/integrations/appIntegrationAction";
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
 * OAuth-popup connect flow shared by every app integration (§6.1 of the spec):
 * the popup lands on the backend callback page which posts
 * `{ type, provider, success }` to window.opener. Primary signal is that
 * postMessage; fallbacks are a popup-closed poll (silent status refetch) and
 * a 3s status poll while the popup is open (covers browsers that block
 * opener messaging).
 */
export const useIntegrationConnectFlow = (
    def: IntegrationDef,
    onFinished?: (outcome: ConnectFlowOutcome) => void,
) => {
    const [busy, setBusy] = useState(false);
    const [popupBlocked, setPopupBlocked] = useState(false);

    const popupRef = useRef<Window | null>(null);
    const closedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const messageHandlerRef = useRef<((e: MessageEvent) => void) | null>(null);
    const settledRef = useRef(false);
    const onFinishedRef = useRef(onFinished);
    onFinishedRef.current = onFinished;

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

    // remove listeners/timers if the detail view unmounts mid-flow
    useEffect(() => cleanup, [cleanup]);

    const settle = useCallback(
        (outcome: ConnectFlowOutcome, { silent = false } = {}) => {
            if (settledRef.current) return;
            settledRef.current = true;
            cleanup();
            try {
                // the callback page does NOT close itself
                popupRef.current?.close();
            } catch {
                // ignore cross-origin close errors
            }
            popupRef.current = null;
            setBusy(false);
            if (!silent) {
                if (outcome === "success") {
                    toast.success(`${def.name} connected`);
                } else if (outcome === "failed") {
                    // the popup page already showed the specific reason —
                    // the payload carries none, so keep this neutral
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
            const res: any = await getIntegrationAuthUrl(def.key);
            const url = typeof res?.data === "string" && res.data.startsWith("http")
                ? res.data
                : null;
            if (!url) {
                setBusy(false);
                const message: string = res?.message || "";
                if (message.includes("OAuth configuration is missing")) {
                    toast.error(
                        "Integration is not configured on the server — please contact support.",
                    );
                } else {
                    toast.error(message || `Could not start ${def.name} sign-in`);
                }
                return;
            }

            const popup = window.open(
                url,
                `${def.key}-oauth`,
                "width=620,height=760,menubar=no,toolbar=no,resizable=yes,scrollbars=yes",
            );
            if (!popup) {
                setBusy(false);
                setPopupBlocked(true);
                return;
            }
            popupRef.current = popup;

            const handleMessage = (event: MessageEvent) => {
                const data = event.data;
                if (
                    data?.type !== INTEGRATION_CALLBACK_MESSAGE_TYPE ||
                    data?.provider !== def.key
                ) {
                    return;
                }
                settle(data?.success === true ? "success" : "failed");
            };
            messageHandlerRef.current = handleMessage;
            window.addEventListener("message", handleMessage);

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
                        const status: any = await getIntegrationStatus(def.key);
                        const payload = status?.data ?? status;
                        if (payload?.connected === true) {
                            settle("success");
                            return;
                        }
                    } catch {
                        // ignore
                    }
                    settle("closed", { silent: true });
                }
            }, CLOSED_POLL_INTERVAL_MS);

            // poll status every 3s only while the connect popup is open
            statusTimerRef.current = setInterval(async () => {
                if (settledRef.current || popupRef.current?.closed) return;
                try {
                    const status: any = await getIntegrationStatus(def.key);
                    const payload = status?.data ?? status;
                    if (payload?.connected === true) {
                        settle("success");
                    }
                } catch {
                    // swallow while polling
                }
            }, STATUS_POLL_INTERVAL_MS);

            safetyTimerRef.current = setTimeout(() => {
                settle("closed", { silent: true });
            }, SAFETY_TIMEOUT_MS);
        } catch (err: any) {
            setBusy(false);
            toast.error(err?.message || `Could not start ${def.name} sign-in`);
        }
    }, [busy, def.key, def.name, settle]);

    return { start, busy, popupBlocked };
};
