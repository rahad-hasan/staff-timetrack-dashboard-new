/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
    getMicrosoftAuthUrl,
    getMicrosoftConnected,
} from "@/actions/integrations/action";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

const extractUrl = (res: any): string | null => {
    if (!res) return null;
    if (typeof res === "string" && res.startsWith("http")) return res;
    if (typeof res?.data === "string" && res.data.startsWith("http")) return res.data;
    if (typeof res?.url === "string") return res.url;
    if (typeof res?.data?.url === "string") return res.data.url;
    return null;
};

export const useMicrosoftConnectFlow = (onConnected?: () => void) => {
    const [busy, setBusy] = useState(false);
    const popupRef = useRef<Window | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const start = useCallback(async () => {
        setBusy(true);
        try {
            const res: any = await getMicrosoftAuthUrl();
            const url = extractUrl(res);
            if (!url) {
                toast.error(res?.message || "Could not start Microsoft sign-in");
                setBusy(false);
                return;
            }

            const features =
                "width=600,height=700,menubar=no,toolbar=no,resizable=yes,scrollbars=yes";
            popupRef.current = window.open(
                url,
                "stafftime-microsoft-connect",
                features,
            );

            if (!popupRef.current) {
                window.location.href = url;
                return;
            }

            const startedAt = Date.now();
            stopPolling();

            timerRef.current = setInterval(async () => {
                if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
                    stopPolling();
                    popupRef.current?.close();
                    setBusy(false);
                    toast.error("Connection cancelled");
                    return;
                }

                try {
                    const status: any = await getMicrosoftConnected();
                    const data = status?.data ?? status;
                    if (data?.connected === true) {
                        stopPolling();
                        popupRef.current?.close();
                        setBusy(false);
                        const email = data?.provider_email;
                        toast.success(
                            email
                                ? `Microsoft connected as ${email}`
                                : "Microsoft connected successfully",
                        );
                        onConnected?.();
                        return;
                    }
                } catch {
                    // swallow during polling
                }

                if (popupRef.current?.closed) {
                    stopPolling();
                    setBusy(false);
                    try {
                        const status: any = await getMicrosoftConnected();
                        const data = status?.data ?? status;
                        if (data?.connected === true) {
                            const email = data?.provider_email;
                            toast.success(
                                email
                                    ? `Microsoft connected as ${email}`
                                    : "Microsoft connected successfully",
                            );
                            onConnected?.();
                            return;
                        }
                    } catch {
                        // ignore
                    }
                    toast.message("Microsoft sign-in window closed");
                }
            }, POLL_INTERVAL_MS);
        } catch (err: any) {
            setBusy(false);
            toast.error(err?.message || "Could not start Microsoft sign-in");
        }
    }, [onConnected, stopPolling]);

    return { start, busy };
};
