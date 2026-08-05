"use client";

import { capitalize, IntegrationDef } from "@/components/Integrations/registry";
import { Button } from "@/components/ui/button";
import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { IntegrationImportResult } from "@/types/type";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    Info,
    Loader2,
    RefreshCcw,
    UserX,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";


interface SectionProps {
    title: string;
    count: number;
    defaultOpen?: boolean;
    icon: ReactNode;
    children: ReactNode;
}

const Section = ({ title, count, defaultOpen = false, icon, children }: SectionProps) => {
    const [open, setOpen] = useState(defaultOpen);
    // a stalled continue-sync flips defaultOpen after mount — surface the
    // skip reasons instead of leaving the section collapsed
    useEffect(() => {
        if (defaultOpen) setOpen(true);
    }, [defaultOpen]);
    return (
        <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left cursor-pointer"
            >
                <span className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-200">
                    {icon}
                    {title}
                    <span className="rounded-full bg-amber-200/70 dark:bg-amber-500/20 px-1.5 text-[10px] font-semibold">
                        {count}
                    </span>
                </span>
                <ChevronDown
                    className={cn(
                        "h-3.5 w-3.5 text-amber-700 dark:text-amber-300 transition-transform",
                        open && "rotate-180",
                    )}
                />
            </button>
            {open && <div className="px-3 pb-3">{children}</div>}
        </div>
    );
};

const StatTile = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3">
        <p className="text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary">
            {label}
        </p>
        <p className="mt-0.5 text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
            {value}
        </p>
    </div>
);

interface IntegrationResultDialogProps {
    def: IntegrationDef;
    mode: "import" | "sync";
    result: IntegrationImportResult;
    /** continue-sync call currently running */
    continuing?: boolean;
    /** brief post-409 cooldown — §8: keep the button disabled a few seconds */
    continueCooldown?: boolean;
    /** two consecutive sync calls returned identical remaining ids */
    stalled?: boolean;
    /**
     * id → display label from the picker list, so skipped rows read as names
     * instead of raw provider ids (Jira's are opaque composites, §13.1).
     */
    labelById?: Map<string, string>;
    onContinueSync?: () => void;
    onClose: () => void;
}

const IntegrationResultDialog = ({
    def,
    mode,
    result,
    continuing = false,
    continueCooldown = false,
    stalled = false,
    labelById,
    onContinueSync,
    onClose,
}: IntegrationResultDialogProps) => {
    const noun = def.noun;
    const imported = result.imported ?? [];
    const skipped = result.skipped ?? [];
    const unmatched = result.unmatched_users ?? [];
    const remaining = result.remaining_ids ?? [];

    const nothingImported = imported.length === 0;
    const projectsCreated = imported.filter((item) => item.created).length;
    const projectsUpdated = imported.length - projectsCreated;
    const tasksCreated = imported.reduce((sum, item) => sum + (item.tasks_created || 0), 0);
    const tasksUpdated = imported.reduce((sum, item) => sum + (item.tasks_updated || 0), 0);
    const tasksSkipped = imported.reduce((sum, item) => sum + (item.tasks_skipped || 0), 0);

    const blockClose = continuing;

    return (
        <DialogContent
            className="sm:max-w-2xl dark:bg-darkSecondaryBg"
            showCloseButton={!blockClose}
            onInteractOutside={(e) => {
                if (blockClose) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
                if (blockClose) e.preventDefault();
            }}
        >
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-headingTextColor dark:text-darkTextPrimary">
                    {nothingImported ? (
                        <>
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            No {noun.plural} were imported
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            {mode === "import" ? "Import complete" : "Sync complete"}
                        </>
                    )}
                </DialogTitle>
                <DialogDescription>
                    {nothingImported
                        ? `Every selected ${noun.singular} was skipped — the reasons are listed below.`
                        : `Here is what changed in this ${mode === "import" ? "import" : "sync"} from ${def.name}.`}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto thin-scrollbar pr-1">
                {!nothingImported && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatTile label="Projects created" value={projectsCreated} />
                        <StatTile label="Projects updated" value={projectsUpdated} />
                        <StatTile label="Tasks created" value={tasksCreated} />
                        <StatTile label="Tasks updated" value={tasksUpdated} />
                    </div>
                )}

                {!nothingImported && tasksSkipped > 0 && (
                    <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                        {tasksSkipped} task{tasksSkipped === 1 ? "" : "s"} skipped
                        (unchanged {def.countNoun}s or per-{def.countNoun} failures) —
                        this is not an error.
                    </p>
                )}

                {!nothingImported && def.notes?.result && (
                    <p className="flex items-start gap-1.5 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 px-3 py-2.5 text-xs text-subTextColor dark:text-darkTextSecondary">
                        <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
                        <span>{def.notes.result}</span>
                    </p>
                )}

                {remaining.length > 0 && !stalled && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10 px-3 py-2.5">
                        <p className="flex-1 text-xs text-blue-800 dark:text-blue-200">
                            {remaining.length}{" "}
                            {remaining.length === 1 ? noun.singular : noun.plural} still
                            pending — the server syncs up to 25 {noun.plural} per run.
                        </p>
                        <Button
                            size="sm"
                            onClick={onContinueSync}
                            disabled={continuing || continueCooldown}
                            className="gap-2 shrink-0"
                        >
                            {continuing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RefreshCcw className="h-3.5 w-3.5" />
                            )}
                            {continuing ? "Syncing…" : "Continue sync"}
                        </Button>
                    </div>
                )}

                {stalled && (
                    <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                        Sync is not making progress on the remaining{" "}
                        {remaining.length}{" "}
                        {remaining.length === 1 ? noun.singular : noun.plural} — check
                        the skipped reasons below before trying again.
                    </div>
                )}

                {imported.length > 0 && (
                    <ul className="space-y-2">
                        {/* one board pasted as URL + checked as row can come
                            back as two result rows with the same canonical id */}
                        {imported.map((item, index) => (
                            <li
                                key={`${item.id}-${index}`}
                                className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3"
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                        {item.name}
                                    </p>
                                    {item.badge && (
                                        <span className="inline-flex items-center rounded-full border border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg px-2 py-0.5 text-[10px] font-medium text-subTextColor dark:text-darkTextSecondary">
                                            {item.badge}
                                        </span>
                                    )}
                                    <span
                                        className={cn(
                                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                            item.created
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
                                                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
                                        )}
                                    >
                                        {item.created ? "Project created" : "Project updated"}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary">
                                    {item.tasks_created} task
                                    {item.tasks_created === 1 ? "" : "s"} created ·{" "}
                                    {item.tasks_updated} updated · {item.tasks_skipped} skipped
                                </p>
                                {item.truncated && (
                                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
                                        Very large {noun.singular} — only the first ~3000{" "}
                                        {def.countNoun}s were imported. New {def.countNoun}s
                                        will still arrive via live updates.
                                    </p>
                                )}
                                {!item.webhook_registered && (
                                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
                                        Automatic updates unavailable for this {noun.singular}{" "}
                                        — use Sync.
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {skipped.length > 0 && (
                    <Section
                        title={`Skipped ${noun.plural}`}
                        count={skipped.length}
                        defaultOpen={nothingImported || stalled}
                        icon={<AlertTriangle className="h-3.5 w-3.5" />}
                    >
                        <ul className="space-y-1.5">
                            {/* a failing board/list can be skipped again on a
                                continue-sync run, so the id alone is not a unique key */}
                            {skipped.map((item, index) => {
                                // provider ids can be opaque (Jira's are
                                // "<cloudId>:<projectId>") — prefer the name
                                // the picker already knows
                                const label =
                                    labelById?.get(item.id) ??
                                    `${capitalize(noun.singular)} ${item.id}`;
                                return (
                                    <li
                                        key={`${item.id}-${index}`}
                                        className="text-xs text-amber-800 dark:text-amber-200 break-words"
                                    >
                                        <span className="font-medium">{label}:</span>{" "}
                                        {item.reason}
                                    </li>
                                );
                            })}
                        </ul>
                    </Section>
                )}

                {unmatched.length > 0 && (
                    <Section
                        title={`Unmatched ${def.name} users`}
                        count={unmatched.length}
                        icon={<UserX className="h-3.5 w-3.5" />}
                    >
                        <p className="mb-2 text-xs text-amber-800 dark:text-amber-200">
                            {/* Trello never exposes member emails, so its intro
                                replaces the invite-by-email advice entirely */}
                            {def.notes?.unmatchedUsersIntro ??
                                `These ${def.name} users have no matching account here, so their ${def.countNoun}s were assigned to you. Invite them with the same email to match them on the next sync.${
                                    def.notes?.unmatchedUsers
                                        ? ` ${def.notes.unmatchedUsers}`
                                        : ""
                                }`}
                        </p>
                        <ul className="space-y-1.5">
                            {unmatched.map((user) => (
                                <li
                                    key={user.id}
                                    className="text-xs text-amber-800 dark:text-amber-200"
                                >
                                    <span className="font-medium">{user.name}</span>
                                    {user.email ? ` — ${user.email}` : ""}
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}
            </div>

            <DialogFooter>
                <Button onClick={onClose} disabled={blockClose} className="min-w-24">
                    Done
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default IntegrationResultDialog;
