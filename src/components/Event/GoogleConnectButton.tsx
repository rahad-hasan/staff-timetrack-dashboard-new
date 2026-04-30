/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertTriangle,
    Check,
    ChevronDown,
    Loader2,
    Plug,
    Unlink,
} from "lucide-react";
import { GoogleIcon } from "./eventHelpers";
import {
    disconnectGoogle,
    getGoogleConnected,
} from "@/actions/integrations/action";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GoogleConnectedResponse } from "@/types/type";
import { useGoogleConnectFlow } from "../Integrations/useGoogleConnectFlow";

const GoogleConnectButton = () => {
    const [status, setStatus] = useState<GoogleConnectedResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const refresh = async () => {
        try {
            const res: any = await getGoogleConnected();
            const data: GoogleConnectedResponse | undefined = res?.data ?? res;
            if (data && typeof data.connected === "boolean") {
                setStatus(data);
            } else {
                setStatus({
                    connected: false,
                    provider: "google",
                    status: "disconnected",
                    provider_email: null,
                    token_expiry: null,
                    last_synced_at: null,
                });
            }
        } catch {
            setStatus({
                connected: false,
                provider: "google",
                status: "disconnected",
                provider_email: null,
                token_expiry: null,
                last_synced_at: null,
            });
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

    if (loading) {
        return (
            <Button
                variant="outline2"
                size="sm"
                disabled
                className="gap-2 text-headingTextColor dark:text-darkTextPrimary"
                aria-label="Checking Google connection"
            >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Checking…</span>
            </Button>
        );
    }

    const needsReconnect =
        status?.status === "expired" || status?.status === "revoked";

    if (!status?.connected) {
        return (
            <Button
                variant="outline2"
                size="sm"
                onClick={startConnect}
                disabled={connectBusy}
                className={cn(
                    "gap-2 hover:border-primary/50 text-headingTextColor dark:text-darkTextPrimary",
                    needsReconnect &&
                        "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20",
                    connectBusy && "opacity-70",
                )}
            >
                {connectBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : needsReconnect ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                    <GoogleIcon className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                    {needsReconnect ? "Reconnect Google" : "Connect Google"}
                </span>
                <span className="sm:hidden">
                    {needsReconnect ? "Reconnect" : "Connect"}
                </span>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline2"
                    size="sm"
                    className="gap-2 border-primary/40 bg-primary/5 hover:bg-primary/10 text-headingTextColor dark:text-darkTextPrimary"
                >
                    <GoogleIcon className="h-3.5 w-3.5" />
                    <span className="hidden md:inline truncate max-w-[160px] text-headingTextColor dark:text-darkTextPrimary">
                        {status.provider_email ?? "Google connected"}
                    </span>
                    <span className="md:hidden inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3 w-3" />
                        Synced
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-64 dark:bg-darkSecondaryBg dark:border-darkBorder"
            >
                <DropdownMenuLabel className="flex items-center gap-2 py-3">
                    <GoogleIcon className="h-4 w-4" />
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-headingTextColor dark:text-darkTextPrimary truncate">
                            {status.provider_email || "Google account"}
                        </p>
                        <p className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Connected
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-darkBorder" />
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        startConnect();
                    }}
                    disabled={connectBusy}
                    className="cursor-pointer text-xs"
                >
                    <Plug className="h-3.5 w-3.5" />
                    Reconnect account
                </DropdownMenuItem>
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        handleDisconnect();
                    }}
                    disabled={busy}
                    className="cursor-pointer text-xs text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                    <Unlink className="h-3.5 w-3.5" />
                    Disconnect Google
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default GoogleConnectButton;
