"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MondayBoard, MondayImportPayload } from "@/types/type";
import { endOfDay } from "date-fns";
import {
    AlertTriangle,
    ChevronDown,
    ChevronDownIcon,
    Loader2,
    RefreshCcw,
    Search,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { IntegrationDef } from "./registry";

const SELECTION_CAP = 25;

interface MondayBoardPickerDialogProps {
    def: IntegrationDef;
    boards: MondayBoard[] | null;
    boardsLoading: boolean;
    boardsError: string | null;
    onRefreshBoards: () => void;
    importing: boolean;
    /** brief post-409 cooldown — §8: keep the button disabled a few seconds */
    importCooldown?: boolean;
    onImport: (payload: MondayImportPayload) => void;
    onCancel: () => void;
}

const MondayBoardPickerDialog = ({
    def,
    boards,
    boardsLoading,
    boardsError,
    onRefreshBoards,
    importing,
    importCooldown = false,
    onImport,
    onCancel,
}: MondayBoardPickerDialogProps) => {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [defaultsOpen, setDefaultsOpen] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [openStartDate, setOpenStartDate] = useState(false);
    const [openDeadline, setOpenDeadline] = useState(false);

    const filteredBoards = useMemo(() => {
        if (!boards) return [];
        const query = search.trim().toLowerCase();
        if (!query) return boards;
        return boards.filter(
            (board) =>
                board.name.toLowerCase().includes(query) ||
                board.workspace?.name?.toLowerCase().includes(query),
        );
    }, [boards, search]);

    const toggleBoard = (board: MondayBoard) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(board.id)) {
                next.delete(board.id);
            } else if (next.size < SELECTION_CAP) {
                next.add(board.id);
            }
            return next;
        });
    };

    const capReached = selected.size >= SELECTION_CAP;

    const deadlineError = useMemo(() => {
        if (!deadline) return null;
        const deadlineEnd = endOfDay(deadline);
        if (startDate && deadlineEnd < startDate) {
            return "Deadline must be on or after the start date.";
        }
        if (!startDate && deadlineEnd < new Date()) {
            return "Deadline can't be in the past when no start date is set.";
        }
        return null;
    }, [deadline, startDate]);

    const handleImport = () => {
        if (selected.size === 0 || deadlineError || importing || importCooldown) return;
        const payload: MondayImportPayload = { board_ids: [...selected] };
        // the API only accepts UTC ISO datetimes ending in `Z` —
        // always produced via toISOString()
        if (startDate) payload.start_date = startDate.toISOString();
        if (deadline) payload.deadline = endOfDay(deadline).toISOString();
        onImport(payload);
    };

    return (
        <DialogContent
            className="sm:max-w-2xl dark:bg-darkSecondaryBg"
            showCloseButton={!importing}
            onInteractOutside={(e) => {
                if (importing) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
                if (importing) e.preventDefault();
            }}
        >
            <DialogHeader>
                <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
                    Import boards from {def.name}
                </DialogTitle>
                <DialogDescription>
                    Boards become projects and their items become tasks. Boards marked
                    “Imported” can be selected again to re-sync them — nothing is
                    duplicated.
                </DialogDescription>
            </DialogHeader>

            {importing ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                        Importing {selected.size} board{selected.size === 1 ? "" : "s"}…
                    </p>
                    <p className="max-w-sm text-xs text-subTextColor dark:text-darkTextSecondary">
                        Large boards can take a few minutes. Please keep this window open —
                        leaving now will hide the result (the import itself keeps running).
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filter boards…"
                                className="pl-9 dark:bg-darkPrimaryBg dark:border-darkBorder"
                            />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span
                                className={cn(
                                    "text-xs font-medium",
                                    capReached
                                        ? "text-amber-600 dark:text-amber-300"
                                        : "text-subTextColor dark:text-darkTextSecondary",
                                )}
                            >
                                {selected.size} / {SELECTION_CAP} selected
                            </span>
                            <Button
                                variant="outline2"
                                size="sm"
                                onClick={onRefreshBoards}
                                disabled={boardsLoading}
                                aria-label="Refresh boards"
                            >
                                <RefreshCcw
                                    className={cn(
                                        "h-3.5 w-3.5",
                                        boardsLoading && "animate-spin",
                                    )}
                                />
                            </Button>
                        </div>
                    </div>

                    {capReached && (
                        <p className="text-xs text-amber-600 dark:text-amber-300">
                            You can import at most {SELECTION_CAP} boards per run — deselect
                            one to pick another.
                        </p>
                    )}

                    <div className="max-h-[42vh] overflow-y-auto thin-scrollbar rounded-lg border border-borderColor dark:border-darkBorder divide-y divide-borderColor dark:divide-darkBorder">
                        {boardsLoading && (
                            <div className="flex items-center gap-2 p-4 text-xs text-subTextColor dark:text-darkTextSecondary">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Loading boards from {def.name} — this can take a few
                                seconds…
                            </div>
                        )}

                        {!boardsLoading && boardsError && (
                            <div className="p-4">
                                <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                                    {boardsError}
                                </div>
                                <Button
                                    variant="outline2"
                                    size="sm"
                                    className="mt-3"
                                    onClick={onRefreshBoards}
                                >
                                    Try again
                                </Button>
                            </div>
                        )}

                        {!boardsLoading && !boardsError && boards && boards.length === 0 && (
                            <p className="p-4 text-xs text-subTextColor dark:text-darkTextSecondary">
                                No boards found in this {def.name} account.
                            </p>
                        )}

                        {!boardsLoading &&
                            !boardsError &&
                            boards &&
                            boards.length > 0 &&
                            filteredBoards.length === 0 && (
                                <p className="p-4 text-xs text-subTextColor dark:text-darkTextSecondary">
                                    No boards match your search.
                                </p>
                            )}

                        {!boardsLoading &&
                            !boardsError &&
                            filteredBoards.map((board) => {
                                const checked = selected.has(board.id);
                                const disabled = !checked && capReached;
                                return (
                                    <label
                                        key={board.id}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5",
                                            disabled
                                                ? "opacity-50 cursor-not-allowed"
                                                : "cursor-pointer hover:bg-bgSecondary/60 dark:hover:bg-darkPrimaryBg/60",
                                        )}
                                    >
                                        <Checkbox
                                            checked={checked}
                                            disabled={disabled}
                                            onCheckedChange={() => toggleBoard(board)}
                                            className="cursor-pointer data-[state=checked]:bg-primary border-primary"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary truncate">
                                                    {board.name}
                                                </span>
                                                {board.already_imported && (
                                                    <span className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                                                        Imported
                                                    </span>
                                                )}
                                            </span>
                                            <span className="block text-xs text-subTextColor dark:text-darkTextSecondary truncate">
                                                {board.workspace?.name
                                                    ? `${board.workspace.name} · `
                                                    : ""}
                                                {board.items_count} item
                                                {board.items_count === 1 ? "" : "s"}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                    </div>

                    <div className="rounded-lg border border-borderColor dark:border-darkBorder">
                        <button
                            type="button"
                            onClick={() => setDefaultsOpen((o) => !o)}
                            className="flex w-full items-center justify-between px-3 py-2.5 text-left cursor-pointer"
                        >
                            <span className="text-xs font-medium text-headingTextColor dark:text-darkTextPrimary">
                                Project defaults (optional)
                            </span>
                            <ChevronDown
                                className={cn(
                                    "h-3.5 w-3.5 text-subTextColor dark:text-darkTextSecondary transition-transform",
                                    defaultsOpen && "rotate-180",
                                )}
                            />
                        </button>
                        {defaultsOpen && (
                            <div className="border-t border-borderColor dark:border-darkBorder p-3">
                                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                                    Applied to newly created projects only. Start defaults to
                                    now; deadline defaults to one year after the start date.
                                </p>
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-headingTextColor dark:text-darkTextPrimary">
                                            Start date
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <Popover
                                                open={openStartDate}
                                                onOpenChange={setOpenStartDate}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline2"
                                                        className="flex-1 py-1.5 justify-between font-normal dark:text-darkTextPrimary dark:bg-darkPrimaryBg"
                                                    >
                                                        {startDate
                                                            ? startDate.toLocaleDateString()
                                                            : "Select start date"}
                                                        <ChevronDownIcon />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto overflow-hidden p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={startDate}
                                                        captionLayout="dropdown"
                                                        onSelect={(date) => {
                                                            setStartDate(date);
                                                            setOpenStartDate(false);
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {startDate && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label="Clear start date"
                                                    onClick={() => setStartDate(undefined)}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-headingTextColor dark:text-darkTextPrimary">
                                            Deadline
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <Popover
                                                open={openDeadline}
                                                onOpenChange={setOpenDeadline}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline2"
                                                        className="flex-1 py-1.5 justify-between font-normal dark:text-darkTextPrimary dark:bg-darkPrimaryBg"
                                                    >
                                                        {deadline
                                                            ? deadline.toLocaleDateString()
                                                            : "Select deadline"}
                                                        <ChevronDownIcon />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto overflow-hidden p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={deadline}
                                                        captionLayout="dropdown"
                                                        onSelect={(date) => {
                                                            setDeadline(date);
                                                            setOpenDeadline(false);
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {deadline && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label="Clear deadline"
                                                    onClick={() => setDeadline(undefined)}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {deadlineError && (
                                    <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        {deadlineError}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!importing && (
                <DialogFooter>
                    <Button variant="outline2" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={selected.size === 0 || !!deadlineError || importCooldown}
                        className="gap-2"
                    >
                        Import {selected.size > 0 ? selected.size : ""} board
                        {selected.size === 1 ? "" : "s"}
                    </Button>
                </DialogFooter>
            )}
        </DialogContent>
    );
};

export default MondayBoardPickerDialog;
