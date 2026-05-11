/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import googleMeetIcon from "../../assets/events/google_meet.svg";
import microsoftTeamsIcon from "../../assets/events/microsoft-teams.svg";
import { EventSyncStatus } from "@/types/type";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Link2Off,
    Loader2,
    MinusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
                <Image src={googleMeetIcon} width={50} height={50} className="w-5" alt="" />
            ) : (
                <Image src={microsoftTeamsIcon} width={50} height={50} className="w-5" alt="" />
            )}
            {isGoogle ? "Google Meet" : "Microsoft Teams"}
        </span>
    );
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