/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { getGoogleConnected } from "@/actions/integrations/action";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "../ui/button";
import { useGoogleConnectFlow } from "./useGoogleConnectFlow";
import { GoogleConnectionStatus } from "@/types/type";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "stafftime-google-reconnect-dismissed";

const needsAttention = (s?: GoogleConnectionStatus) =>
    s === "expired" || s === "revoked";

const GoogleReconnectBanner = () => {
    const [status, setStatus] = useState<GoogleConnectionStatus | null>(null);
    const [dismissed, setDismissed] = useState(false);

    const refresh = async () => {
        try {
            const res: any = await getGoogleConnected();
            const data = res?.data ?? res;
            setStatus(data?.status ?? null);
        } catch {
            setStatus(null);
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            setDismissed(sessionStorage.getItem(DISMISS_KEY) === "true");
        }
        refresh();
    }, []);

    const { start: startConnect, busy } = useGoogleConnectFlow(() => {
        refresh();
        if (typeof window !== "undefined") {
            sessionStorage.removeItem(DISMISS_KEY);
            setDismissed(false);
        }
    });

    const handleDismiss = () => {
        setDismissed(true);
        if (typeof window !== "undefined") {
            sessionStorage.setItem(DISMISS_KEY, "true");
        }
    };

    if (dismissed || !needsAttention(status ?? undefined)) return null;

    return (
        <div
            className={cn(
                "mb-3 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border px-4 py-3",
                "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10",
            )}
            role="alert"
        >
            <div className="flex items-start gap-2 flex-1 min-w-0">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300 mt-0.5 shrink-0" />
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        Your Google connection needs attention
                    </p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                        Calendar sync is paused. Reconnect to resume Google Meet and Calendar features.
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                    onClick={startConnect}
                    disabled={busy}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                    {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Reconnect
                </Button>
                <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="icon-sm"
                    className="text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-500/20"
                    aria-label="Dismiss"
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
};

export default GoogleReconnectBanner;
