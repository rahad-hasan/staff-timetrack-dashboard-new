/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
    disconnectSlackWorkspace,
    getSlackStatus,
    getSlackWorkspaceAuthUrl,
    updateSlackSettings,
} from "@/actions/integrations/slackIntegrationAction";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SlackStatusResponse, SlackWorkspaceSettings } from "@/types/type";
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    Check,
    Clock3,
    Loader2,
    Unlink,
} from "lucide-react";
import Image from "next/image";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { IntegrationDef } from "./registry";
import SlackPersonalCard from "./SlackPersonalCard";
import { useIntegrationConnectFlow } from "./useIntegrationConnectFlow";

const statusMeta = {
    connected: {
        label: "Connected",
        className:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
        icon: Check,
    },
    disconnected: {
        label: "Not connected",
        className:
            "bg-gray-100 text-gray-600 border-gray-200 dark:bg-darkBorder/40 dark:text-darkTextSecondary dark:border-darkBorder",
        icon: Unlink,
    },
    // §1 — expired and revoked render identically: "Connection lost"
    expired: {
        label: "Connection lost",
        className:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
        icon: AlertTriangle,
    },
    revoked: {
        label: "Connection lost",
        className:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
        icon: AlertTriangle,
    },
} as const;

const REMINDER_MIN = 1;
const REMINDER_MAX = 1440;

interface SettingRowProps {
    label: string;
    description: string;
    control: ReactNode;
}

const SettingRow = ({ label, description, control }: SettingRowProps) => (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 px-3 py-2.5">
        <div className="min-w-0">
            <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                {label}
            </p>
            <p className="mt-0.5 text-xs text-subTextColor dark:text-darkTextSecondary max-w-md">
                {description}
            </p>
        </div>
        {control}
    </div>
);

interface SlackIntegrationDetailProps {
    def: IntegrationDef;
    onBack: () => void;
}

/**
 * Slack is a messaging surface, not a project-management provider (slack
 * spec §1) — no boards, no import, no sync, no assignee matching. One card,
 * two stacked sections (§4): the company workspace (admin connect/disconnect
 * + the company toggles) and the requesting user's own account.
 */
const SlackIntegrationDetail = ({ def, onBack }: SlackIntegrationDetailProps) => {
    const [status, setStatus] = useState<SlackStatusResponse | null>(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [statusError, setStatusError] = useState<string | null>(null);

    const [settings, setSettings] = useState<SlackWorkspaceSettings | null>(null);
    const [savingSetting, setSavingSetting] = useState(false);
    const [reminderDraft, setReminderDraft] = useState("");

    const lastStatusFetchRef = useRef(0);
    /** drops out-of-order GET responses — only the newest fetch may apply */
    const fetchSeqRef = useRef(0);
    /**
     * Bumped on every local settings write (PATCH success or rollback) so a
     * GET that was already in flight when the write happened cannot clobber
     * the fresher local settings with its pre-write payload.
     */
    const settingsWriteSeqRef = useRef(0);
    /** while the reminder input is focused its draft is never overwritten */
    const reminderFocusedRef = useRef(false);

    const applyServerSettings = useCallback(
        (next: SlackWorkspaceSettings | null) => {
            setSettings(next);
            if (next && !reminderFocusedRef.current) {
                setReminderDraft(String(next.reminder_minutes));
            }
        },
        [],
    );

    const fetchStatus = useCallback(
        async ({ silent = false } = {}) => {
            lastStatusFetchRef.current = Date.now();
            const fetchSeq = ++fetchSeqRef.current;
            const writeSeqAtStart = settingsWriteSeqRef.current;
            if (!silent) setStatusLoading(true);
            try {
                const res: any = await getSlackStatus();
                // a newer fetch superseded this one — let that one win
                if (fetchSeq !== fetchSeqRef.current) return;
                if (res?.success) {
                    const payload = res?.data ?? null;
                    setStatus(payload);
                    setStatusError(null);
                    if (writeSeqAtStart === settingsWriteSeqRef.current) {
                        applyServerSettings(
                            payload?.workspace?.settings ?? null,
                        );
                    }
                } else {
                    setStatusError(
                        res?.message || "Failed to load Slack status",
                    );
                }
            } catch {
                if (fetchSeq === fetchSeqRef.current) {
                    setStatusError("Failed to load Slack status");
                }
            } finally {
                if (fetchSeq === fetchSeqRef.current) {
                    setStatusLoading(false);
                }
            }
        },
        [applyServerSettings],
    );

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // refetch on window focus once the data is ~30s stale (base spec §7 —
    // catches a workspace disconnected/revoked while this tab was hidden)
    useEffect(() => {
        const onFocus = () => {
            if (Date.now() - lastStatusFetchRef.current > 30_000) {
                fetchStatus({ silent: true });
            }
        };
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [fetchStatus]);

    const {
        start: startConnect,
        busy: connectBusy,
        popupBlocked,
    } = useIntegrationConnectFlow(
        def,
        // §2.3 — the callback never says which flow completed; refetch once
        // on every outcome and let both sections re-render from the payload
        () => fetchStatus({ silent: true }),
        {
            getAuthUrl: getSlackWorkspaceAuthUrl,
            checkConnected: async () => {
                const res: any = await getSlackStatus();
                return res?.data?.workspace?.connected === true;
            },
            windowName: "slack-workspace-oauth",
            successToast: "Slack workspace connected",
        },
    );

    const handleDisconnect = async () => {
        try {
            const res: any = await disconnectSlackWorkspace();
            if (res?.success) {
                toast.success(
                    res?.message || "Slack workspace disconnected",
                );
            } else {
                toast.error(
                    res?.message || "Failed to disconnect the Slack workspace",
                );
            }
        } catch {
            toast.error("Failed to disconnect the Slack workspace");
        } finally {
            await fetchStatus({ silent: true });
        }
    };

    /** Optimistic PATCH with rollback (§4) — `data` is the full resolved settings object. */
    const patchSettings = async (patch: Partial<SlackWorkspaceSettings>) => {
        if (!settings || savingSetting) return;
        const prev = settings;
        setSettings({ ...settings, ...patch });
        setSavingSetting(true);
        try {
            const res: any = await updateSlackSettings(patch);
            // both outcomes are local writes — stale in-flight GETs must not
            // overwrite what the server just confirmed / what we rolled back to
            settingsWriteSeqRef.current += 1;
            if (res?.success && res?.data?.settings) {
                applyServerSettings(res.data.settings);
            } else {
                applyServerSettings(prev);
                // validation envelope → surface the field-level message (§5)
                toast.error(
                    res?.errorMessages?.[0]?.message ||
                        res?.message ||
                        "Could not update Slack settings",
                );
                if (
                    typeof res?.message === "string" &&
                    res.message.includes("not connected")
                ) {
                    fetchStatus({ silent: true });
                }
            }
        } catch {
            settingsWriteSeqRef.current += 1;
            applyServerSettings(prev);
            toast.error("Could not update Slack settings");
        } finally {
            setSavingSetting(false);
        }
    };

    // §6.6 — patch on commit (blur/Enter), never per keystroke
    const commitReminder = () => {
        if (!settings) return;
        const value = Number(reminderDraft);
        if (
            !Number.isInteger(value) ||
            value < REMINDER_MIN ||
            value > REMINDER_MAX
        ) {
            toast.error(
                `Reminder lead time must be a whole number between ${REMINDER_MIN} and ${REMINDER_MAX} minutes.`,
            );
            setReminderDraft(String(settings.reminder_minutes));
            return;
        }
        if (value === settings.reminder_minutes) return;
        patchSettings({ reminder_minutes: value });
    };

    const workspace = status?.workspace;
    const wsStatus = workspace?.status ?? "disconnected";
    const wsConnected = wsStatus === "connected";
    const wsLost = wsStatus === "expired" || wsStatus === "revoked";
    const meta = statusMeta[wsStatus] ?? statusMeta.disconnected;
    const StatusIcon = meta.icon;

    return (
        <div className="mt-5">
            <button
                type="button"
                onClick={onBack}
                className="mb-4 flex items-center gap-1.5 text-sm text-subTextColor hover:text-headingTextColor dark:text-darkTextSecondary dark:hover:text-darkTextPrimary cursor-pointer"
            >
                <ArrowLeft className="h-4 w-4" />
                All integrations
            </button>

            {statusLoading && !status ? (
                <div className="rounded-2xl border border-borderColor dark:border-darkBorder bg-white dark:bg-darkSecondaryBg p-5 sm:p-6 animate-pulse">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-3 w-72 max-w-full rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="h-16 rounded-lg bg-gray-200 dark:bg-gray-700" />
                        <div className="h-16 rounded-lg bg-gray-200 dark:bg-gray-700" />
                    </div>
                </div>
            ) : statusError && !status ? (
                <div className="rounded-2xl border border-borderColor dark:border-darkBorder bg-white dark:bg-darkSecondaryBg p-5 sm:p-6">
                    <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                        {statusError}
                    </div>
                    <Button
                        variant="outline2"
                        size="sm"
                        className="mt-3"
                        onClick={() => fetchStatus()}
                    >
                        Try again
                    </Button>
                </div>
            ) : (
                <div className="rounded-2xl border border-borderColor dark:border-darkBorder bg-white dark:bg-darkSecondaryBg overflow-hidden">
                    <div className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-xl bg-bgSecondary dark:bg-darkPrimaryBg border border-borderColor dark:border-darkBorder flex items-center justify-center shrink-0">
                                    <Image
                                        src={def.logo}
                                        width={50}
                                        height={50}
                                        className="w-6"
                                        alt=""
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                            {def.name}
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
                                        {def.blurb}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 self-start">
                                {!wsConnected && (
                                    <Button
                                        onClick={startConnect}
                                        disabled={connectBusy}
                                        className={cn(
                                            "gap-2",
                                            wsLost &&
                                                "bg-amber-600 hover:bg-amber-700 text-white",
                                        )}
                                    >
                                        {connectBusy ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Image
                                                src={def.logo}
                                                width={50}
                                                height={50}
                                                className="w-4"
                                                alt=""
                                            />
                                        )}
                                        {wsLost ? "Reconnect" : "Connect Slack"}
                                    </Button>
                                )}
                                {/* §2.5 — the endpoint is NOT idempotent (400
                                    unless connected), so no disconnect button
                                    outside the connected state */}
                                {wsConnected && (
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
                                        title="Disconnect the Slack workspace?"
                                        description="Stops Slack event messages and notification mirroring for everyone. Members who linked their own Slack accounts keep their status sync until they disconnect individually."
                                        confirmText="Disconnect"
                                        cancelText="Cancel"
                                        onConfirm={handleDisconnect}
                                    />
                                )}
                            </div>
                        </div>

                        {popupBlocked && (
                            <div className="mt-5 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                                Your browser blocked the Slack sign-in popup.
                                Allow popups for this site, then click{" "}
                                {wsLost ? "Reconnect" : "Connect"} again.
                            </div>
                        )}

                        {wsLost && (
                            <div className="mt-5 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                                Connection lost — reconnect to resume event
                                messages and notification mirroring. Members who
                                linked their own Slack accounts keep their
                                status sync.
                            </div>
                        )}

                        {!wsConnected && !wsLost && (
                            <div className="mt-5 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-4">
                                <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    How it works
                                </p>
                                <ul className="mt-2 space-y-1.5 text-xs text-subTextColor dark:text-darkTextSecondary list-disc pl-4">
                                    <li>
                                        Assigned members get a Slack message
                                        when an event is created, rescheduled,
                                        or cancelled — plus a reminder before it
                                        starts.
                                    </li>
                                    <li>
                                        In-app notifications (leave, project,
                                        task, unusual activity) are also
                                        delivered as Slack messages.
                                    </li>
                                    <li>
                                        Members who link their own Slack account
                                        show “⏱ Tracking time” on their Slack
                                        profile while they&apos;re tracking —
                                        statuses they typed themselves are never
                                        overwritten.
                                    </li>
                                </ul>
                                <p className="mt-3 text-xs text-subTextColor dark:text-darkTextSecondary">
                                    Only a company admin can connect the Slack
                                    workspace.
                                </p>
                            </div>
                        )}

                        {wsConnected && (
                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3">
                                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary">
                                        <Building2 className="h-3 w-3" />{" "}
                                        Workspace
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary truncate">
                                        {workspace?.team_name ??
                                            "Slack workspace"}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3">
                                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary">
                                        <Clock3 className="h-3 w-3" /> Reminder
                                        lead time
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                        {settings
                                            ? `${settings.reminder_minutes} minute${settings.reminder_minutes === 1 ? "" : "s"} before events`
                                            : "—"}
                                    </p>
                                </div>
                            </div>
                        )}

                        {wsConnected && settings && (
                            <div className="mt-5">
                                <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    Workspace settings
                                </p>
                                <div className="mt-3 space-y-2">
                                    <SettingRow
                                        label="Event messages"
                                        description="Message assigned members when an event is created, rescheduled, or cancelled — with a reminder before it starts."
                                        control={
                                            <Switch
                                                checked={settings.notify_events}
                                                disabled={savingSetting}
                                                onCheckedChange={(checked) =>
                                                    patchSettings({
                                                        notify_events: checked,
                                                    })
                                                }
                                                aria-label="Event messages"
                                            />
                                        }
                                    />
                                    <SettingRow
                                        label="Notification mirroring"
                                        description="Deliver in-app notifications (leave, project, task, unusual activity) as Slack messages too."
                                        control={
                                            <Switch
                                                checked={settings.notify_dm}
                                                disabled={savingSetting}
                                                onCheckedChange={(checked) =>
                                                    patchSettings({
                                                        notify_dm: checked,
                                                    })
                                                }
                                                aria-label="Notification mirroring"
                                            />
                                        }
                                    />
                                    <SettingRow
                                        label="Status sync"
                                        description="Company-wide switch — when off, no member's Slack status is synced, regardless of their personal setting."
                                        control={
                                            <Switch
                                                checked={settings.status_sync}
                                                disabled={savingSetting}
                                                onCheckedChange={(checked) =>
                                                    patchSettings({
                                                        status_sync: checked,
                                                    })
                                                }
                                                aria-label="Status sync"
                                            />
                                        }
                                    />
                                    <SettingRow
                                        label="Reminder lead time"
                                        description="Minutes before an event start for the reminder message (1–1440). Applies to reminders scheduled after the change."
                                        control={
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Input
                                                    type="number"
                                                    min={REMINDER_MIN}
                                                    max={REMINDER_MAX}
                                                    step={1}
                                                    value={reminderDraft}
                                                    disabled={savingSetting}
                                                    onChange={(e) =>
                                                        setReminderDraft(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onFocus={() => {
                                                        reminderFocusedRef.current = true;
                                                    }}
                                                    onBlur={() => {
                                                        reminderFocusedRef.current = false;
                                                        commitReminder();
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.currentTarget.blur();
                                                        }
                                                    }}
                                                    className="h-8 w-20 text-sm"
                                                    aria-label="Reminder lead time in minutes"
                                                />
                                                <span className="text-xs text-subTextColor dark:text-darkTextSecondary">
                                                    min
                                                </span>
                                            </div>
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mt-5 border-t border-borderColor dark:border-darkBorder pt-5">
                            <SlackPersonalCard
                                status={status}
                                loading={statusLoading}
                                error={statusError}
                                onRetry={() => fetchStatus()}
                                refetch={fetchStatus}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SlackIntegrationDetail;
