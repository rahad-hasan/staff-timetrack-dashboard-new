/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
    disconnectGoogle,
    getGoogleStatus,
} from "@/actions/integrations/action";
import { GoogleStatusFullResponse } from "@/types/type";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
    AlertTriangle,
    Calendar as CalendarIcon,
    Check,
    Loader2,
    Mail,
    RefreshCcw,
    ShieldCheck,
    Unlink,
} from "lucide-react";
import { GoogleIcon } from "../Event/eventHelpers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useGoogleConnectFlow } from "./useGoogleConnectFlow";
import { formatDistanceToNowStrict } from "date-fns";

const statusMeta = {
    connected: {
        label: "Connected",
        className:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
        icon: Check,
    },
    disconnected: {
        label: "Disconnected",
        className:
            "bg-gray-100 text-gray-600 border-gray-200 dark:bg-darkBorder/40 dark:text-darkTextSecondary dark:border-darkBorder",
        icon: Unlink,
    },
    expired: {
        label: "Reconnect required",
        className:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
        icon: AlertTriangle,
    },
    revoked: {
        label: "Access revoked",
        className:
            "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30",
        icon: AlertTriangle,
    },
} as const;

const formatRelative = (iso?: string | null) => {
    if (!iso) return "—";
    try {
        return `${formatDistanceToNowStrict(new Date(iso))} ago`;
    } catch {
        return "—";
    }
};

const GoogleStatusCard = () => {
    const [data, setData] = useState<GoogleStatusFullResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const refresh = async () => {
        setLoading(true);
        try {
            const res: any = await getGoogleStatus();
            const payload: GoogleStatusFullResponse = res?.data ?? res;
            setData(payload ?? null);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const { start: startConnect, busy: connectBusy } = useGoogleConnectFlow(
        () => refresh(),
    );

    const handleDisconnect = async () => {
        setBusy(true);
        try {
            const res: any = await disconnectGoogle();
            if (res?.success) {
                toast.success(res?.message || "Google disconnected");
                refresh();
            } else {
                toast.error(res?.message || "Failed to disconnect");
            }
        } finally {
            setBusy(false);
        }
    };

    const status = data?.status ?? "disconnected";
    const meta = statusMeta[status as keyof typeof statusMeta] ?? statusMeta.disconnected;
    const StatusIcon = meta.icon;
    const isConnected = data?.connected === true;
    const needsReconnect = status === "expired" || status === "revoked";

    return (
        <div className="rounded-2xl border border-borderColor dark:border-darkBorder bg-white dark:bg-darkSecondaryBg overflow-hidden">
            <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-bgSecondary dark:bg-darkPrimaryBg border border-borderColor dark:border-darkBorder flex items-center justify-center shrink-0">
                            <GoogleIcon className="h-7 w-7" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    Google Calendar
                                </h3>
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                        meta.className,
                                    )}
                                >
                                    <StatusIcon className="h-3 w-3" />
                                    {meta.label}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary max-w-md">
                                Sync your StaffTime-Track events to Google Calendar and
                                auto-generate Google Meet links for meetings.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                        {!isConnected && (
                            <Button
                                onClick={startConnect}
                                disabled={connectBusy}
                                className={cn(
                                    "gap-2",
                                    needsReconnect &&
                                        "bg-amber-600 hover:bg-amber-700 text-white",
                                )}
                            >
                                {connectBusy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <GoogleIcon className="h-3.5 w-3.5" />
                                )}
                                {needsReconnect ? "Reconnect" : "Connect Google"}
                            </Button>
                        )}
                        {isConnected && (
                            <>
                                <Button
                                    variant="outline2"
                                    onClick={refresh}
                                    disabled={loading}
                                    size="sm"
                                    aria-label="Refresh status"
                                    className="text-headingTextColor dark:text-darkTextPrimary"
                                >
                                    <RefreshCcw
                                        className={cn(
                                            "h-3.5 w-3.5",
                                            loading && "animate-spin",
                                        )}
                                    />
                                </Button>
                                <Button
                                    variant="outline2"
                                    onClick={handleDisconnect}
                                    disabled={busy}
                                    size="sm"
                                    className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
                                >
                                    <Unlink className="h-3.5 w-3.5" />
                                    Disconnect
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="mt-5 flex items-center gap-2 text-xs text-subTextColor dark:text-darkTextSecondary">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading integration status…
                    </div>
                )}

                {!loading && needsReconnect && (
                    <div className="mt-5 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                        Your Google connection needs attention — calendar sync is paused
                        until you reconnect.
                    </div>
                )}

                {!loading && isConnected && (
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3">
                            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary">
                                <Mail className="h-3 w-3" /> Connected account
                            </p>
                            <p className="mt-1 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary truncate">
                                {data?.provider_email ?? "—"}
                            </p>
                        </div>
                        <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3">
                            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary">
                                <CalendarIcon className="h-3 w-3" /> Last synced
                            </p>
                            <p className="mt-1 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                {formatRelative(data?.last_synced_at)}
                            </p>
                        </div>
                        {data?.scope && data.scope.length > 0 && (
                            <div className="sm:col-span-2 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3">
                                <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary">
                                    <ShieldCheck className="h-3 w-3" /> Granted scopes
                                </p>
                                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                                    {data.scope.map((s) => (
                                        <li
                                            key={s}
                                            className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-borderColor dark:border-darkBorder bg-white dark:bg-darkSecondaryBg text-subTextColor dark:text-darkTextSecondary truncate max-w-full"
                                        >
                                            {s.replace("https://www.googleapis.com/auth/", "")}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoogleStatusCard;
