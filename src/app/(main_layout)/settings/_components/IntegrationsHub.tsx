/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
    IntegrationConnectionStatus,
    IntegrationStatusResponse,
} from "@/types/type";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, ChevronRight, Unlink } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { IntegrationDef, IntegrationKey, INTEGRATIONS } from "@/components/Integrations/registry";
import { getIntegrationStatus } from "@/actions/integrations/appIntegrationAction";

const chipMeta: Record<
    "connected" | "not_connected" | "connection_lost",
    { label: string; className: string; icon: typeof Check }
> = {
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
};

const toChipKey = (status?: IntegrationConnectionStatus) => {
    if (status === "connected") return "connected" as const;
    if (status === "expired" || status === "revoked") {
        return "connection_lost" as const;
    }
    return "not_connected" as const;
};

interface IntegrationsHubProps {
    onOpen: (def: IntegrationDef) => void;
}

const IntegrationsHub = ({ onOpen }: IntegrationsHubProps) => {
    console.log(onOpen)
    const [statuses, setStatuses] = useState<
        Partial<Record<IntegrationKey, IntegrationStatusResponse>>
    >({});
    const [loadingStatuses, setLoadingStatuses] = useState(true);
    const lastFetchRef = useRef(0);
    const unmountedRef = useRef(false);

    const loadStatuses = useCallback(async () => {
        lastFetchRef.current = Date.now();
        const available = INTEGRATIONS.filter((def) => def.available);
        const results = await Promise.all(
            available.map(async (def) => {
                try {
                    const res: any = await getIntegrationStatus(def.key);
                    const payload = res?.data ?? null;
                    return [def.key, payload] as const;
                } catch {
                    return [def.key, null] as const;
                }
            }),
        );
        if (unmountedRef.current) return;
        const next: Partial<Record<IntegrationKey, IntegrationStatusResponse>> = {};
        results.forEach(([key, payload]) => {
            if (payload) next[key] = payload;
        });
        setStatuses(next);
        setLoadingStatuses(false);
    }, []);

    useEffect(() => {
        unmountedRef.current = false;
        loadStatuses();
        // refresh the chips when the tab regains focus and data is ~30s stale
        const onFocus = () => {
            if (Date.now() - lastFetchRef.current > 30_000) loadStatuses();
        };
        window.addEventListener("focus", onFocus);
        return () => {
            unmountedRef.current = true;
            window.removeEventListener("focus", onFocus);
        };
    }, [loadStatuses]);

    return (
        <div className="mt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {INTEGRATIONS.map((def) => {
                    const status = statuses[def.key];
                    const chip = chipMeta[toChipKey(status?.status)];
                    const ChipIcon = chip.icon;

                    return (
                        <button
                            key={def.key}
                            type="button"
                            onClick={() => def.available && onOpen(def)}
                            disabled={!def.available}
                            className={cn(
                                "rounded-2xl border border-borderColor dark:border-darkBorder bg-white dark:bg-darkSecondaryBg p-5 text-left transition-all",
                                def.available
                                    ? "cursor-pointer hover:border-primary/50 hover:shadow-sm group"
                                    : "cursor-default opacity-70",
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="h-12 w-12 rounded-xl bg-bgSecondary dark:bg-darkPrimaryBg border border-borderColor dark:border-darkBorder flex items-center justify-center shrink-0">
                                    <Image
                                        src={def.logo}
                                        width={50}
                                        height={50}
                                        className="w-6"
                                        alt=""
                                    />
                                </div>
                                {def.available ? (
                                    loadingStatuses ? (
                                        <span className="h-5 w-24 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                    ) : (
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                                chip.className,
                                            )}
                                        >
                                            <ChipIcon className="h-3 w-3" />
                                            {chip.label}
                                        </span>
                                    )
                                ) : (
                                    <span className="inline-flex items-center rounded-full border border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg px-2 py-0.5 text-[11px] font-medium text-subTextColor dark:text-darkTextSecondary">
                                        Coming soon
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 flex items-center gap-1.5">
                                <h3 className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    {def.name}
                                </h3>
                                {def.available && (
                                    <ChevronRight className="h-4 w-4 text-subTextColor dark:text-darkTextSecondary transition-transform group-hover:translate-x-0.5" />
                                )}
                            </div>
                            <p className="mt-0.5 text-[11px] uppercase tracking-wider font-semibold text-subTextColor dark:text-darkTextSecondary">
                                {def.categoryLabel}
                            </p>
                            <p className="mt-2 text-xs text-subTextColor dark:text-darkTextSecondary">
                                {def.blurb}
                            </p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default IntegrationsHub;
