"use client";

import { Button } from "@/components/ui/button";
import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MondayImportResult } from "@/types/type";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    Loader2,
    RefreshCcw,
    UserX,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { IntegrationDef } from "./registry";

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
    result: MondayImportResult;
    /** continue-sync call currently running */
    continuing?: boolean;
    /** brief post-409 cooldown — §8: keep the button disabled a few seconds */
    continueCooldown?: boolean;
    /** two consecutive sync calls returned identical remaining boards */
    stalled?: boolean;
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
    onContinueSync,
    onClose,
}: IntegrationResultDialogProps) => {
    const imported = result.imported ?? [];
    const skipped = result.skipped_boards ?? [];
    const unmatched = result.unmatched_monday_users ?? [];
    const remaining = result.remaining_board_ids ?? [];

    const nothingImported = imported.length === 0;
    const projectsCreated = imported.filter((b) => b.created).length;
    const projectsUpdated = imported.length - projectsCreated;
    const tasksCreated = imported.reduce((sum, b) => sum + (b.tasks_created || 0), 0);
    const tasksUpdated = imported.reduce((sum, b) => sum + (b.tasks_updated || 0), 0);
    const tasksSkipped = imported.reduce((sum, b) => sum + (b.tasks_skipped || 0), 0);

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
                            No boards were imported
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
                        ? "Every selected board was skipped — the reasons are listed below."
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
                        (unchanged items or per-item failures) — this is not an error.
                    </p>
                )}

                {remaining.length > 0 && !stalled && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10 px-3 py-2.5">
                        <p className="flex-1 text-xs text-blue-800 dark:text-blue-200">
                            {remaining.length} board{remaining.length === 1 ? "" : "s"} still
                            pending — the server syncs up to 25 boards per run.
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
                        {remaining.length} board{remaining.length === 1 ? "" : "s"} — check
                        the skipped reasons below before trying again.
                    </div>
                )}

                {imported.length > 0 && (
                    <ul className="space-y-2">
                        {imported.map((board) => (
                            <li
                                key={board.board_id}
                                className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3"
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                        {board.board_name}
                                    </p>
                                    <span
                                        className={cn(
                                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                            board.created
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
                                                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
                                        )}
                                    >
                                        {board.created ? "Project created" : "Project updated"}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary">
                                    {board.tasks_created} task
                                    {board.tasks_created === 1 ? "" : "s"} created ·{" "}
                                    {board.tasks_updated} updated · {board.tasks_skipped} skipped
                                </p>
                                {board.items_truncated && (
                                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
                                        Very large board — only the first ~3000 items were
                                        imported. New items will still arrive via live updates.
                                    </p>
                                )}
                                {!board.webhooks_registered && (
                                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
                                        Automatic updates unavailable for this board — use Sync.
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {skipped.length > 0 && (
                    <Section
                        title="Skipped boards"
                        count={skipped.length}
                        defaultOpen={nothingImported || stalled}
                        icon={<AlertTriangle className="h-3.5 w-3.5" />}
                    >
                        <ul className="space-y-1.5">
                            {/* a failing board can be skipped again on a continue-sync
                                run, so the id alone is not a unique key */}
                            {skipped.map((board, index) => (
                                <li
                                    key={`${board.board_id}-${index}`}
                                    className="text-xs text-amber-800 dark:text-amber-200"
                                >
                                    <span className="font-medium">Board {board.board_id}:</span>{" "}
                                    {board.reason}
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}

                {unmatched.length > 0 && (
                    <Section
                        title="Unmatched monday users"
                        count={unmatched.length}
                        icon={<UserX className="h-3.5 w-3.5" />}
                    >
                        <p className="mb-2 text-xs text-amber-800 dark:text-amber-200">
                            These monday users have no matching account here (by email), so
                            their items were assigned to you. Invite them with the same
                            email to match them on the next sync.
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
