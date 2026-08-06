/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
    disconnectSlackPersonal,
    getSlackPersonalAuthUrl,
    getSlackStatus,
    updateSlackPersonalSettings,
} from "@/actions/integrations/slackIntegrationAction";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SlackStatusResponse } from "@/types/type";
import {
    AlertTriangle,
    Check,
    Info,
    Loader2,
    Unlink,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getIntegrationDef, IntegrationDef } from "./registry";
import { useIntegrationConnectFlow } from "./useIntegrationConnectFlow";

const chipMeta = {
    connected: {
        label: "Connected",
        className:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
        icon: Check,
    },
    not_connected: {
        label: "Not connected",
        className:
            "bg-gray-100 text-gray-600 border-gray-200 dark:bg-darkBorder/40 dark:text-darkTextSecondary dark:border-darkBorder",
        icon: Unlink,
    },
    connection_lost: {
        label: "Connection lost",
        className:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
        icon: AlertTriangle,
    },
} as const;

interface SlackPersonalCardProps {
    status: SlackStatusResponse | null;
    loading: boolean;
    error?: string | null;
    onRetry?: () => void;
    /**
     * Refetch GET /slack/status once — the callback payload never says which
     * flow completed (§2.3), so every outcome funnels through this and both
     * sections re-render from the fresh payload.
     */
    refetch: (opts?: { silent?: boolean }) => void | Promise<void>;
}

/**
 * The member-facing Slack surface (slack spec §4): personal connect for every
 * role (including employee), the status-sync toggle with the resolved-state
 * logic from §3, and personal disconnect. Rendered inside the admin card's
 * "Your account" section and on the profile Connected-apps card.
 */
const SlackPersonalCard = ({
    status,
    loading,
    error,
    onRetry,
    refetch,
}: SlackPersonalCardProps) => {
    const def = getIntegrationDef("slack") as IntegrationDef;

    const [togglePending, setTogglePending] = useState<boolean | null>(null);
    /**
     * The value the server confirmed via the PATCH response (§2.8). Held so
     * the switch keeps showing the persisted state even when the follow-up
     * status refetch fails (fetchStatus swallows errors and keeps the stale
     * payload) — cleared once a fresh status agrees or the toggle unmounts.
     */
    const [confirmedSync, setConfirmedSync] = useState<boolean | null>(null);

    useEffect(() => {
        if (confirmedSync === null) return;
        if (
            !status?.personal?.connected ||
            status.personal.status_sync === confirmedSync
        ) {
            setConfirmedSync(null);
        }
    }, [status, confirmedSync]);

    const {
        start: startConnect,
        busy: connectBusy,
        popupBlocked,
    } = useIntegrationConnectFlow(
        def,
        // refetch on every outcome — success, failure or closed popup (§2.3)
        () => refetch({ silent: true }),
        {
            getAuthUrl: getSlackPersonalAuthUrl,
            checkConnected: async () => {
                const res: any = await getSlackStatus();
                return res?.data?.personal?.connected === true;
            },
            windowName: "slack-personal-oauth",
            successToast: "Slack account connected",
        },
    );

    const handleToggle = async (next: boolean) => {
        if (togglePending !== null) return;
        setTogglePending(next); // optimistic
        try {
            const res: any = await updateSlackPersonalSettings({
                status_sync: next,
            });
            if (res?.success) {
                setConfirmedSync(
                    typeof res?.data?.status_sync === "boolean"
                        ? res.data.status_sync
                        : next,
                );
                // hold the optimistic value until the fresh status is in so
                // the switch never flickers back
                await refetch({ silent: true });
            } else {
                toast.error(res?.message || "Could not update status sync");
                if (
                    typeof res?.message === "string" &&
                    res.message.includes("not connected")
                ) {
                    refetch({ silent: true });
                }
            }
        } catch {
            toast.error("Could not update status sync");
        } finally {
            setTogglePending(null);
        }
    };

    const handleDisconnect = async () => {
        try {
            const res: any = await disconnectSlackPersonal();
            if (res?.success) {
                toast.success(res?.message || "Slack account disconnected");
            } else {
                toast.error(
                    res?.message || "Failed to disconnect your Slack account",
                );
            }
        } catch {
            toast.error("Failed to disconnect your Slack account");
        } finally {
            await refetch({ silent: true });
        }
    };

    if (loading && !status) {
        return (
            <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-4 animate-pulse">
                <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-2 h-3 w-64 max-w-full rounded bg-gray-200 dark:bg-gray-700" />
            </div>
        );
    }

    if (!status) {
        return (
            <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-4">
                <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                    {error || "Failed to load Slack status"}
                </div>
                {onRetry && (
                    <Button
                        variant="outline2"
                        size="sm"
                        className="mt-3"
                        onClick={onRetry}
                    >
                        Try again
                    </Button>
                )}
            </div>
        );
    }

    const workspace = status.workspace;
    const personal = status.personal;
    const personalLost =
        personal.status === "expired" || personal.status === "revoked";
    const chip = personal.connected
        ? chipMeta.connected
        : personalLost
            ? chipMeta.connection_lost
            : chipMeta.not_connected;
    const ChipIcon = chip.icon;

    // §3 — the company switch trumps the personal one; settings only exist
    // once a workspace row does, and "absent" must not read as "paused"
    const companySyncOff = workspace.settings?.status_sync === false;
    const personalSyncOn =
        togglePending ?? confirmedSync ?? personal.status_sync === true;

    return (
        <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Image
                        src={def.logo}
                        width={50}
                        height={50}
                        className="w-4"
                        alt=""
                    />
                    <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                        Your Slack account
                    </p>
                    <span
                        className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            chip.className,
                        )}
                    >
                        <ChipIcon className="h-3 w-3" />
                        {chip.label}
                    </span>
                </div>

                {personal.connected && (
                    <ConfirmDialog
                        trigger={
                            <Button
                                variant="outline2"
                                size="sm"
                                className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                                <Unlink className="h-3.5 w-3.5" />
                                Disconnect
                            </Button>
                        }
                        title="Disconnect your Slack account?"
                        description="Your Slack status will stop showing “Tracking time” (an active tracking status is cleared — statuses you typed yourself are never touched). Event and notification messages from the company workspace are not affected."
                        confirmText="Disconnect"
                        cancelText="Cancel"
                        onConfirm={handleDisconnect}
                    />
                )}
            </div>

            {popupBlocked && (
                <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                    Your browser blocked the Slack sign-in popup. Allow popups
                    for this site, then click{" "}
                    {personalLost ? "Reconnect" : "Connect"} again.
                </div>
            )}

            {/* §4 — members must never hit the "connect the workspace first"
                400: the empty state explains it instead. This also covers a
                lost personal token while the workspace is down — reconnecting
                is impossible until an admin reconnects the workspace (§2.2) */}
            {!personal.connected && !workspace.connected && (
                <div className="mt-3">
                    {personalLost && (
                        <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                            Connection lost — your Slack link is no longer
                            valid.
                        </div>
                    )}
                    <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                        Ask an admin to connect Slack first.
                    </p>
                </div>
            )}

            {!personal.connected && !personalLost && workspace.connected && (
                <div className="mt-3">
                    <p className="text-xs text-subTextColor dark:text-darkTextSecondary max-w-md">
                        Shows “⏱ Tracking time” on your Slack profile while
                        you&apos;re tracking. Your own custom statuses are never
                        overwritten.
                    </p>
                    <Button
                        size="sm"
                        className="mt-3 gap-2"
                        onClick={startConnect}
                        disabled={connectBusy}
                    >
                        {connectBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Image
                                src={def.logo}
                                width={50}
                                height={50}
                                className="w-3.5"
                                alt=""
                            />
                        )}
                        Connect your Slack account
                    </Button>
                </div>
            )}

            {personalLost && workspace.connected && (
                <div className="mt-3">
                    <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                        Connection lost — reconnect your Slack account to resume
                        status sync.
                    </div>
                    <Button
                        size="sm"
                        className="mt-3 gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={startConnect}
                        disabled={connectBusy}
                    >
                        {connectBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Image
                                src={def.logo}
                                width={50}
                                height={50}
                                className="w-3.5"
                                alt=""
                            />
                        )}
                        Reconnect
                    </Button>
                </div>
            )}

            {personal.connected && (
                <div className="mt-3">
                    {workspace.team_name && (
                        <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                            Linked to{" "}
                            <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                {workspace.team_name}
                            </span>
                        </p>
                    )}
                    <div className="mt-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                Status sync
                            </p>
                            <p className="mt-0.5 text-xs text-subTextColor dark:text-darkTextSecondary max-w-md">
                                Shows “⏱ Tracking time” on your Slack profile
                                while you&apos;re tracking. Your own custom
                                statuses are never overwritten.
                            </p>
                        </div>
                        <Switch
                            checked={personalSyncOn}
                            disabled={togglePending !== null}
                            onCheckedChange={handleToggle}
                            aria-label="Status sync"
                        />
                    </div>
                    {personalSyncOn && companySyncOff && (
                        <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                            <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
                            Status sync is paused by your admin.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default SlackPersonalCard;
