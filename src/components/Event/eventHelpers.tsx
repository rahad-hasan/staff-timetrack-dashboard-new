/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn } from "@/lib/utils";
import { EventSyncStatus } from "@/types/type";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Link2Off,
    Loader2,
    MinusCircle,
} from "lucide-react";

const STATUS_META: Record<
    EventSyncStatus,
    {
        label: string;
        className: string;
        Icon: React.ComponentType<{ className?: string }>;
    }
> = {
    not_requested: {
        label: "Not requested",
        className:
            "bg-gray-100 text-gray-600 border-gray-200 dark:bg-darkBorder/40 dark:text-darkTextSecondary dark:border-darkBorder",
        Icon: MinusCircle,
    },
    pending_connection: {
        label: "Pending connection",
        className:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
        Icon: Link2Off,
    },
    pending: {
        label: "Pending",
        className:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
        Icon: Clock,
    },
    processing: {
        label: "Processing",
        className:
            "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30",
        Icon: Loader2,
    },
    synced: {
        label: "Synced",
        className:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
        Icon: CheckCircle2,
    },
    failed: {
        label: "Failed",
        className:
            "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30",
        Icon: AlertCircle,
    },
};

export const SyncStatusPill = ({
    status,
    className,
}: {
    status: EventSyncStatus;
    className?: string;
}) => {
    const meta = STATUS_META[status] ?? STATUS_META.not_requested;
    const { Icon } = meta;
    const spin = status === "processing";

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                meta.className,
                className,
            )}
        >
            <Icon className={cn("h-3 w-3", spin && "animate-spin")} />
            {meta.label}
        </span>
    );
};

export const GoogleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path
            fill="#FFC107"
            d="M43.61 20.08H42V20H24v8h11.3c-1.65 4.66-6.08 8-11.3 8c-6.62 0-12-5.38-12-12s5.38-12 12-12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4C12.95 4 4 12.95 4 24s8.95 20 20 20s20-8.95 20-20c0-1.34-.14-2.65-.39-3.92"
        />
        <path
            fill="#FF3D00"
            d="m6.31 14.69l6.57 4.82C14.66 15.11 18.96 12 24 12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4C16.32 4 9.66 8.34 6.31 14.69"
        />
        <path
            fill="#4CAF50"
            d="M24 44c5.16 0 9.86-1.98 13.41-5.21l-6.19-5.24A11.93 11.93 0 0 1 24 36c-5.2 0-9.62-3.32-11.28-7.95l-6.51 5.02C9.55 39.56 16.23 44 24 44"
        />
        <path
            fill="#1976D2"
            d="M43.61 20.08H42V20H24v8h11.3c-.79 2.24-2.23 4.16-4.09 5.55h.01l6.19 5.24C36.97 39.2 44 34 44 24c0-1.34-.14-2.65-.39-3.92"
        />
    </svg>
);

export const MicrosoftIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 23 23" className={className} aria-hidden="true">
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#7FBA00" d="M12 1h10v10H12z" />
        <path fill="#00A4EF" d="M1 12h10v10H1z" />
        <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
);

export const ProviderBadge = ({
    provider,
}: {
    provider: "google_meet" | "microsoft_teams" | null | undefined;
}) => {
    if (!provider) return null;
    const isGoogle = provider === "google_meet";
    return (
        <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-borderColor dark:border-darkBorder bg-white dark:bg-darkPrimaryBg px-3.5 py-2 text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary shadow-sm">
            {isGoogle ? (
                <GoogleIcon className="h-4 w-4" />
            ) : (
                <MicrosoftIcon className="h-4 w-4" />
            )}
            {isGoogle ? "Google Meet" : "Microsoft Teams"}
        </span>
    );
};

export const parseConflictMessage = (
    message: string | undefined,
): string[] => {
    if (!message) return [];
    return message
        .split(/(?<=[a-zA-Z0-9.])\s*\n\s*|(?<=UTC\.)\s+(?=[A-Z])/)
        .map((line) => line.trim())
        .filter(Boolean);
};

export const isConflictResponse = (res: any) => {
    if (!res) return false;
    if (res.success) return false;
    const msg: string | undefined = res?.message;
    if (!msg) return false;
    return /\balready\b|\bconflict\b|\bscheduled for\b/i.test(msg);
};
