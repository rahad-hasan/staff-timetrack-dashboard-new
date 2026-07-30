/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
    disconnectIntegration,
    getIntegrationItems,
    getIntegrationStatus,
    importIntegrationItems,
    syncIntegration,
} from "@/actions/integrations/appIntegrationAction";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
    IntegrationImportPayload,
    IntegrationImportResult,
    IntegrationItem,
    IntegrationStatusResponse,
} from "@/types/type";
import { formatDistanceToNowStrict } from "date-fns";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowUpRight,
    Calendar as CalendarIcon,
    Check,
    Download,
    Loader2,
    Mail,
    RefreshCcw,
    Unlink,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import IntegrationPickerDialog from "./IntegrationPickerDialog";
import IntegrationResultDialog from "./IntegrationResultDialog";
import { IntegrationDef } from "./registry";
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
    expired: {
        label: "Connection lost",
        className:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
        icon: AlertTriangle,
    },
    revoked: {
        label: "Connection lost",
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

/** §4.7 — merge continuation results: concat rows, union users by id. */
const mergeResults = (
    a: IntegrationImportResult,
    b: IntegrationImportResult,
): IntegrationImportResult => ({
    imported: [...(a.imported ?? []), ...(b.imported ?? [])],
    skipped: [...(a.skipped ?? []), ...(b.skipped ?? [])],
    unmatched_users: [
        ...(a.unmatched_users ?? []),
        ...(b.unmatched_users ?? []),
    ].filter((user, index, arr) => arr.findIndex((u) => u.id === user.id) === index),
    remaining_ids: b.remaining_ids,
});

const sameIds = (a: string[], b: string[]) =>
    a.length === b.length && a.every((id) => b.includes(id));

interface ResultView {
    mode: "import" | "sync";
    result: IntegrationImportResult;
    stalled: boolean;
}

interface IntegrationDetailProps {
    def: IntegrationDef;
    onBack: () => void;
}

const IntegrationDetail = ({ def, onBack }: IntegrationDetailProps) => {
    const router = useRouter();

    const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [statusError, setStatusError] = useState<string | null>(null);

    const [items, setItems] = useState<IntegrationItem[] | null>(null);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [itemsError, setItemsError] = useState<string | null>(null);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [continuing, setContinuing] = useState(false);
    const [mutationCooldown, setMutationCooldown] = useState(false);
    const [resultView, setResultView] = useState<ResultView | null>(null);
    const [reconnectHint, setReconnectHint] = useState(false);

    const prevRemainingRef = useRef<string[] | null>(null);
    const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastStatusFetchRef = useRef(0);

    const fetchStatus = useCallback(
        async ({ silent = false } = {}) => {
            lastStatusFetchRef.current = Date.now();
            if (!silent) setStatusLoading(true);
            try {
                const res: any = await getIntegrationStatus(def.key);
                if (res?.success) {
                    setStatus(res?.data ?? null);
                    setStatusError(null);
                } else {
                    setStatusError(res?.message || "Failed to load integration status");
                }
            } catch {
                setStatusError("Failed to load integration status");
            } finally {
                setStatusLoading(false);
            }
        },
        [def.key],
    );

    const fetchItems = useCallback(
        async ({ silent = false } = {}) => {
            if (!def.capabilities.boardPicker) return;
            if (!silent) {
                setItemsLoading(true);
                setItemsError(null);
            }
            try {
                const res: any = await getIntegrationItems(def.key);
                if (res?.success) {
                    setItems(res?.data ?? []);
                    setItemsError(null);
                } else if (res?.statusCode === 401) {
                    // provider revoked the token — no logout; close the picker
                    // so the Connection-lost state is actually visible
                    setItems(null);
                    setItemsError(res?.message || "Connection lost — reconnect the account.");
                    setPickerOpen(false);
                    fetchStatus({ silent: true });
                } else {
                    const message: string =
                        res?.message || `Failed to load ${def.noun.plural}`;
                    if (message.includes("not connected")) {
                        // connection dropped between renders — refresh the status
                        setItems(null);
                        setItemsError(message);
                        fetchStatus({ silent: true });
                    } else if (!silent) {
                        setItemsError(message);
                    }
                    // silent background refresh (e.g. right after an import that
                    // ate the provider's rate limit) keeps showing the stale
                    // list instead of replacing it with an error box
                }
            } catch {
                if (!silent) setItemsError(`Failed to load ${def.noun.plural}`);
            } finally {
                setItemsLoading(false);
            }
        },
        [def.capabilities.boardPicker, def.key, def.noun.plural, fetchStatus],
    );

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // §7 — refetch status on window focus once it is ~30s stale (catches a
    // token revoked / disconnected elsewhere while this tab was in background)
    useEffect(() => {
        const onFocus = () => {
            if (Date.now() - lastStatusFetchRef.current > 30_000) {
                fetchStatus({ silent: true });
            }
        };
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [fetchStatus]);

    const connStatus = status?.status ?? "disconnected";
    const isConnected = connStatus === "connected";
    const isLost = connStatus === "expired" || connStatus === "revoked";

    // §5.2 — the items query feeds the imported list and the Sync-disable
    // rule, so it is fetched on detail-view mount whenever connected
    useEffect(() => {
        if (isConnected && def.capabilities.boardPicker) {
            fetchItems();
        }
    }, [isConnected, def.capabilities.boardPicker, fetchItems]);

    // warn before leaving while a long-running import/sync is pending
    const blocking = importing || syncing || continuing;
    useEffect(() => {
        if (!blocking) return;
        const handler = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [blocking]);

    useEffect(() => {
        return () => {
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        };
    }, []);

    const hadPriorConnection = Boolean(status?.id);
    const {
        start: startConnect,
        busy: connectBusy,
        popupBlocked,
    } = useIntegrationConnectFlow(def, (outcome) => {
        if (outcome === "success" && hadPriorConnection) {
            // reconnecting does NOT re-register webhooks — prompt a manual sync
            setReconnectHint(true);
        }
        fetchStatus({ silent: true });
    });

    const startCooldown = () => {
        setMutationCooldown(true);
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = setTimeout(() => setMutationCooldown(false), 5000);
    };

    const handleMutationError = (res: any, fallback: string) => {
        if (res?.statusCode === 401) {
            toast.error(res?.message || fallback);
            fetchStatus({ silent: true });
            return;
        }
        const message: string = res?.message || fallback;
        if (message.includes("already running")) {
            toast.error("An import or sync is already in progress — try again shortly.");
            startCooldown();
        } else if (message.includes("not connected")) {
            // connection dropped mid-flow (e.g. another admin disconnected) —
            // refresh status so the UI leaves the stale Connected state
            toast.error(message);
            setPickerOpen(false);
            fetchStatus({ silent: true });
        } else if (res?.errorMessages?.length) {
            toast.error(res.errorMessages[0]?.message || message);
        } else {
            toast.error(message);
        }
    };

    const afterMutationSuccess = () => {
        fetchStatus({ silent: true });
        fetchItems({ silent: true });
        // imported boards/lists are ordinary projects/tasks — refresh those screens
        router.refresh();
    };

    const handleImport = async (payload: IntegrationImportPayload) => {
        if (blocking) return;
        setImporting(true);
        try {
            const res: any = await importIntegrationItems(def.key, payload);
            if (res?.success) {
                setPickerOpen(false);
                setReconnectHint(false);
                prevRemainingRef.current = null;
                setResultView({ mode: "import", result: res.data, stalled: false });
                afterMutationSuccess();
            } else if (res?.statusCode === 401) {
                setPickerOpen(false);
                handleMutationError(res, "Import failed");
            } else {
                // picker stays open with the selection intact
                handleMutationError(res, "Import failed");
            }
        } catch {
            toast.error(
                "Import request failed — if it was already running it will finish on the server; refresh in a minute.",
            );
        } finally {
            setImporting(false);
        }
    };

    const runSync = async (kind: "fresh" | "continue") => {
        if (blocking || mutationCooldown) return;
        if (kind === "fresh") setSyncing(true);
        else setContinuing(true);
        try {
            const res: any = await syncIntegration(def.key);
            if (res?.success) {
                const data: IntegrationImportResult = res.data;
                const nextRemaining = data.remaining_ids ?? [];
                setReconnectHint(false);
                if (kind === "fresh") {
                    prevRemainingRef.current = nextRemaining;
                    setResultView({ mode: "sync", result: data, stalled: false });
                } else {
                    const prev = prevRemainingRef.current ?? [];
                    // §4.7 — failing boards/lists stay at the front of the queue:
                    // identical remaining lists twice in a row means no progress
                    const stalled =
                        prev.length > 0 &&
                        nextRemaining.length > 0 &&
                        sameIds(prev, nextRemaining);
                    prevRemainingRef.current = nextRemaining;
                    setResultView((current) =>
                        current
                            ? {
                                mode: current.mode,
                                result: mergeResults(current.result, data),
                                stalled,
                            }
                            : { mode: "sync", result: data, stalled },
                    );
                }
                afterMutationSuccess();
            } else {
                handleMutationError(res, "Sync failed");
            }
        } catch {
            toast.error(
                "Sync request failed — if it was already running it will finish on the server; refresh in a minute.",
            );
        } finally {
            if (kind === "fresh") setSyncing(false);
            else setContinuing(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            const res: any = await disconnectIntegration(def.key);
            if (res?.success) {
                toast.success(res?.message || `${def.name} disconnected`);
                setItems(null);
                setItemsError(null);
                setReconnectHint(false);
                await fetchStatus({ silent: true });
            } else {
                toast.error(res?.message || `Failed to disconnect ${def.name}`);
            }
        } catch {
            toast.error(`Failed to disconnect ${def.name}`);
        }
    };

    const meta = statusMeta[connStatus as keyof typeof statusMeta] ?? statusMeta.disconnected;
    const StatusIcon = meta.icon;
    const accountLabel =
        status?.provider_email ??
        status?.metadata?.account_user_name ??
        `${def.name} account`;
    const importedItems = (items ?? []).filter((item) => item.already_imported);
    // §8 — Sync must stay disabled until the items query proves something is
    // imported; while it is still in flight (ClickUp's /lists is slow) the
    // safe reading of "no imported items exist" is to keep it disabled too
    const syncDisabled =
        blocking ||
        mutationCooldown ||
        items === null ||
        importedItems.length === 0;

    const disconnectTrigger = (
        <Button
            variant="outline2"
            size="sm"
            className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
            <Unlink className="h-3.5 w-3.5" />
            Disconnect
        </Button>
    );

    const disconnectConfirm = (
        <ConfirmDialog
            trigger={disconnectTrigger}
            title={`Disconnect ${def.name}?`}
            description={`Disconnecting stops automatic syncing from ${def.name}. Projects and tasks already imported stay in the app and keep working. You can reconnect anytime — after reconnecting, run Sync once to re-enable automatic updates.`}
            confirmText="Disconnect"
            cancelText="Cancel"
            onConfirm={handleDisconnect}
        />
    );

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
                                {!isConnected && (
                                    <Button
                                        onClick={startConnect}
                                        disabled={connectBusy}
                                        className={cn(
                                            "gap-2",
                                            isLost && "bg-amber-600 hover:bg-amber-700 text-white",
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
                                        {isLost ? "Reconnect" : `Connect ${def.name}`}
                                    </Button>
                                )}
                                {isConnected && (
                                    <>
                                        {def.capabilities.boardPicker && (
                                            <Button
                                                onClick={() => setPickerOpen(true)}
                                                disabled={blocking}
                                                className="gap-2"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                Import {def.noun.plural}
                                            </Button>
                                        )}
                                        {def.capabilities.sync && (
                                            <Button
                                                variant="outline2"
                                                size="sm"
                                                onClick={() => runSync("fresh")}
                                                disabled={syncDisabled}
                                                title={
                                                    items === null
                                                        ? itemsLoading
                                                            ? `Checking imported ${def.noun.plural}…`
                                                            : undefined
                                                        : importedItems.length === 0
                                                            ? `Import ${def.noun.plural} first`
                                                            : undefined
                                                }
                                                className="gap-2 text-headingTextColor dark:text-darkTextPrimary"
                                            >
                                                {syncing ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <RefreshCcw className="h-3.5 w-3.5" />
                                                )}
                                                Sync now
                                            </Button>
                                        )}
                                        {disconnectConfirm}
                                    </>
                                )}
                                {isLost && disconnectConfirm}
                            </div>
                        </div>

                        {popupBlocked && (
                            <div className="mt-5 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                                Your browser blocked the {def.name} sign-in popup. Allow
                                popups for this site, then click{" "}
                                {isLost ? "Reconnect" : "Connect"} again.
                            </div>
                        )}

                        {isLost && (
                            <div className="mt-5 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                                {def.name} revoked the connection — reconnect to resume
                                syncing. Projects and tasks already imported keep working.
                            </div>
                        )}

                        {isConnected && reconnectHint && (
                            <div className="mt-5 flex items-start justify-between gap-3 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10 px-3 py-2.5">
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                    Reconnected. Automatic updates stay off until the next
                                    sync — run <span className="font-semibold">Sync now</span>{" "}
                                    once to re-enable them.
                                </p>
                                <button
                                    type="button"
                                    aria-label="Dismiss"
                                    onClick={() => setReconnectHint(false)}
                                    className="shrink-0 cursor-pointer text-blue-700 dark:text-blue-300"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}

                        {!isConnected && !isLost && (
                            <div className="mt-5 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-4">
                                <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    How it works
                                </p>
                                <ul className="mt-2 space-y-1.5 text-xs text-subTextColor dark:text-darkTextSecondary list-disc pl-4">
                                    <li>
                                        Your {def.name} {def.noun.plural} are imported as
                                        projects
                                        {def.countNoun === "task"
                                            ? ", and their tasks come along with them"
                                            : `; their ${def.countNoun}s become tasks`}
                                        .
                                    </li>
                                    <li>
                                        Changes in {def.name} — new {def.countNoun}s, renames,
                                        deletions — sync automatically.
                                    </li>
                                    <li>Assignees are matched to teammates by email address.</li>
                                </ul>
                                <p className="mt-3 text-xs text-subTextColor dark:text-darkTextSecondary">
                                    Only a company admin can connect {def.name}.
                                </p>
                            </div>
                        )}

                        {isConnected && (
                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3">
                                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary">
                                        <Mail className="h-3 w-3" /> Connected account
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary truncate">
                                        {accountLabel}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3">
                                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary">
                                        <CalendarIcon className="h-3 w-3" /> Last synced
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                        {formatRelative(status?.last_synced_at)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {isConnected && def.capabilities.boardPicker && (
                            <div className="mt-5">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                        Imported {def.noun.plural}
                                        {items !== null && (
                                            <span className="ml-1.5 text-xs font-normal text-subTextColor dark:text-darkTextSecondary">
                                                {importedItems.length}
                                            </span>
                                        )}
                                    </p>
                                    <Button
                                        variant="outline2"
                                        size="sm"
                                        onClick={() => fetchItems()}
                                        disabled={itemsLoading}
                                        aria-label={`Refresh ${def.noun.plural}`}
                                        className="text-headingTextColor dark:text-darkTextPrimary"
                                    >
                                        <RefreshCcw
                                            className={cn(
                                                "h-3.5 w-3.5",
                                                itemsLoading && "animate-spin",
                                            )}
                                        />
                                    </Button>
                                </div>

                                {itemsLoading && (
                                    <div className="mt-3 space-y-2">
                                        {[0, 1, 2].map((i) => (
                                            <div
                                                key={i}
                                                className="h-14 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 animate-pulse"
                                            />
                                        ))}
                                    </div>
                                )}

                                {!itemsLoading && itemsError && (
                                    <div className="mt-3">
                                        <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                                            {itemsError}
                                        </div>
                                        <Button
                                            variant="outline2"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() => fetchItems()}
                                        >
                                            Try again
                                        </Button>
                                    </div>
                                )}

                                {!itemsLoading && !itemsError && items !== null && (
                                    importedItems.length === 0 ? (
                                        <p className="mt-3 text-xs text-subTextColor dark:text-darkTextSecondary">
                                            No {def.noun.plural} imported yet — use{" "}
                                            <span className="font-medium">
                                                Import {def.noun.plural}
                                            </span>{" "}
                                            to bring your {def.name} work in.
                                        </p>
                                    ) : (
                                        <ul className="mt-3 space-y-2">
                                            {importedItems.map((item) => {
                                                const context = [
                                                    item.workspace?.name,
                                                    item.space?.name,
                                                    item.folder?.name,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" · ");
                                                return (
                                                    <li
                                                        key={item.id}
                                                        className="flex items-center justify-between gap-3 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 px-3 py-2.5"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary truncate">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-xs text-subTextColor dark:text-darkTextSecondary truncate">
                                                                {context ? `${context} · ` : ""}
                                                                {item.items_count} {def.countNoun}
                                                                {item.items_count === 1 ? "" : "s"}
                                                            </p>
                                                        </div>
                                                        {item.project_id !== null && (
                                                            <Link
                                                                href={`/project-management/projects/${item.project_id}`}
                                                                className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                                                            >
                                                                View project
                                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                                            </Link>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* item picker — child stays mounted only while open so state resets */}
            <Dialog
                open={pickerOpen}
                onOpenChange={(open) => {
                    if (!importing) setPickerOpen(open);
                }}
            >
                {pickerOpen ? (
                    <IntegrationPickerDialog
                        def={def}
                        items={items}
                        itemsLoading={itemsLoading}
                        itemsError={itemsError}
                        onRefreshItems={() => fetchItems()}
                        importing={importing}
                        importCooldown={mutationCooldown}
                        onImport={handleImport}
                        onCancel={() => setPickerOpen(false)}
                    />
                ) : null}
            </Dialog>

            {/* import / sync result */}
            <Dialog
                open={!!resultView}
                onOpenChange={(open) => {
                    if (!open && !continuing) {
                        setResultView(null);
                        prevRemainingRef.current = null;
                    }
                }}
            >
                {resultView ? (
                    <IntegrationResultDialog
                        def={def}
                        mode={resultView.mode}
                        result={resultView.result}
                        continuing={continuing}
                        continueCooldown={mutationCooldown}
                        stalled={resultView.stalled}
                        onContinueSync={() => runSync("continue")}
                        onClose={() => {
                            setResultView(null);
                            prevRemainingRef.current = null;
                        }}
                    />
                ) : null}
            </Dialog>

            {/* blocking progress while a fresh sync runs */}
            <Dialog open={syncing}>
                <DialogContent
                    className="sm:max-w-md dark:bg-darkSecondaryBg"
                    showCloseButton={false}
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogTitle className="sr-only">Sync in progress</DialogTitle>
                    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                            Syncing from {def.name}…
                        </p>
                        <p className="max-w-sm text-xs text-subTextColor dark:text-darkTextSecondary">
                            This can take a few minutes for large{" "}
                            {def.noun.plural}. Please keep this window open.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default IntegrationDetail;
