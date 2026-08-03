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
import { IntegrationImportPayload, IntegrationItem } from "@/types/type";
import { endOfDay } from "date-fns";
import {
    AlertTriangle,
    ChevronDown,
    ChevronDownIcon,
    Folder,
    Loader2,
    Lock,
    RefreshCcw,
    Search,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { capitalize, describeImport, IntegrationDef } from "./registry";

const SELECTION_CAP = 25;

/**
 * Accounts can be huge — Jira allows ~5 sites × 500 projects, Asana ~5
 * workspaces × 1000 (§12.2/§13.2). Rendering every row at once makes the
 * dialog crawl, so only the first slice is mounted until the user filters or
 * explicitly asks for the rest. Never a silent truncation: the remainder is
 * always announced.
 */
const ROW_RENDER_CAP = 200;

interface IntegrationPickerDialogProps {
    def: IntegrationDef;
    items: IntegrationItem[] | null;
    itemsLoading: boolean;
    itemsError: string | null;
    onRefreshItems: () => void;
    importing: boolean;
    /** brief post-409 cooldown — §8: keep the button disabled a few seconds */
    importCooldown?: boolean;
    onImport: (payload: IntegrationImportPayload) => void;
    onCancel: () => void;
}

const IntegrationPickerDialog = ({
    def,
    items,
    itemsLoading,
    itemsError,
    onRefreshItems,
    importing,
    importCooldown = false,
    onImport,
    onCancel,
}: IntegrationPickerDialogProps) => {
    const [search, setSearch] = useState("");
    const [showAllRows, setShowAllRows] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [defaultsOpen, setDefaultsOpen] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [openStartDate, setOpenStartDate] = useState(false);
    const [openDeadline, setOpenDeadline] = useState(false);

    const noun = def.noun;

    const filteredItems = useMemo(() => {
        if (!items) return [];
        const query = search.trim().toLowerCase();
        if (!query) return items;
        return items.filter(
            (item) =>
                item.name.toLowerCase().includes(query) ||
                item.workspace?.name?.toLowerCase().includes(query) ||
                item.space?.name?.toLowerCase().includes(query) ||
                item.badge?.toLowerCase().includes(query),
        );
    }, [items, search]);

    const visibleItems = useMemo(() => {
        if (showAllRows || filteredItems.length <= ROW_RENDER_CAP) {
            return filteredItems;
        }
        const head = filteredItems.slice(0, ROW_RENDER_CAP);
        // a checked row must never fall outside the rendered slice, or it
        // could not be unchecked again — pin selections back in (≤25 rows)
        const headIds = new Set(head.map((item) => item.id));
        const pinned = filteredItems.filter(
            (item) => selected.has(item.id) && !headIds.has(item.id),
        );
        return pinned.length ? [...head, ...pinned] : head;
    }, [filteredItems, showAllRows, selected]);
    const hiddenCount = filteredItems.length - visibleItems.length;

    /**
     * Registry-driven grouping (§11.1 / §12.1 / §13.1): "space" renders
     * ClickUp's Workspace · Space headers (workspace name prefixed only when
     * the account actually spans several workspaces), "workspace" renders the
     * item's top-level container — Asana Workspace / Jira Site — and "none"
     * keeps monday's flat list.
     */
    const grouped = useMemo(() => {
        if (def.groupBy === "none") return null;
        const groups = new Map<
            string,
            { key: string; label: string; rows: IntegrationItem[] }
        >();
        if (def.groupBy === "workspace") {
            for (const item of visibleItems) {
                const key = item.workspace?.id ?? "";
                const label = item.workspace?.name ?? "Other";
                const group = groups.get(key);
                if (group) group.rows.push(item);
                else groups.set(key, { key, label, rows: [item] });
            }
        } else {
            const workspaceIds = new Set(
                (items ?? []).map((item) => item.workspace?.id ?? ""),
            );
            const multiWorkspace = workspaceIds.size > 1;
            for (const item of visibleItems) {
                const key = `${item.workspace?.id ?? ""}:${item.space?.id ?? ""}`;
                const spaceName = item.space?.name ?? "Other";
                const label =
                    multiWorkspace && item.workspace?.name
                        ? `${item.workspace.name} · ${spaceName}`
                        : spaceName;
                const group = groups.get(key);
                if (group) group.rows.push(item);
                else groups.set(key, { key, label, rows: [item] });
            }
        }
        return [...groups.values()];
    }, [def.groupBy, items, visibleItems]);

    const toggleItem = (item: IntegrationItem) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(item.id)) {
                next.delete(item.id);
            } else if (next.size < SELECTION_CAP) {
                next.add(item.id);
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
        const payload: IntegrationImportPayload = { ids: [...selected] };
        // the API only accepts UTC ISO datetimes ending in `Z` —
        // always produced via toISOString()
        if (startDate) payload.start_date = startDate.toISOString();
        if (deadline) payload.deadline = endOfDay(deadline).toISOString();
        onImport(payload);
    };

    const BadgeIcon = def.badgeIcon ?? Folder;

    const renderRow = (item: IntegrationItem) => {
        const checked = selected.has(item.id);
        const disabled = !checked && capReached;
        // grouped rows already show workspace/space in the header
        const context = grouped ? null : item.workspace?.name;
        const subtitle = [
            context,
            item.items_count != null
                ? `${item.items_count} ${def.countNoun}${item.items_count === 1 ? "" : "s"}`
                : null,
        ]
            .filter(Boolean)
            .join(" · ");
        return (
            <label
                key={item.id}
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
                    onCheckedChange={() => toggleItem(item)}
                    className="cursor-pointer data-[state=checked]:bg-primary border-primary"
                />
                <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary truncate">
                            {item.name}
                        </span>
                        {item.is_private && (
                            <Lock
                                role="img"
                                aria-label={`Private ${def.noun.singular}`}
                                className="h-3 w-3 shrink-0 text-subTextColor dark:text-darkTextSecondary"
                            />
                        )}
                        {item.badge && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg px-2 py-0.5 text-[10px] font-medium text-subTextColor dark:text-darkTextSecondary">
                                <BadgeIcon className="h-2.5 w-2.5" />
                                {item.badge}
                            </span>
                        )}
                        {item.already_imported && (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                                Imported
                            </span>
                        )}
                    </span>
                    {subtitle && (
                        <span className="block text-xs text-subTextColor dark:text-darkTextSecondary truncate">
                            {subtitle}
                        </span>
                    )}
                </span>
            </label>
        );
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
                    Import {noun.plural} from {def.name}
                </DialogTitle>
                <DialogDescription>
                    {describeImport(def)} {capitalize(noun.plural)} marked
                    “Imported” can be selected again to re-sync them — nothing is
                    duplicated.
                </DialogDescription>
            </DialogHeader>

            {importing ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                        Importing {selected.size}{" "}
                        {selected.size === 1 ? noun.singular : noun.plural}…
                    </p>
                    <p className="max-w-sm text-xs text-subTextColor dark:text-darkTextSecondary">
                        Large {noun.plural} can take a few minutes. Please keep this
                        window open — leaving now will hide the result (the import
                        itself keeps running).
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
                                placeholder={`Filter ${noun.plural}…`}
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
                                onClick={onRefreshItems}
                                disabled={itemsLoading}
                                aria-label={`Refresh ${noun.plural}`}
                            >
                                <RefreshCcw
                                    className={cn(
                                        "h-3.5 w-3.5",
                                        itemsLoading && "animate-spin",
                                    )}
                                />
                            </Button>
                        </div>
                    </div>

                    {capReached && (
                        <p className="text-xs text-amber-600 dark:text-amber-300">
                            You can import at most {SELECTION_CAP} {noun.plural} per
                            run — deselect one to pick another.
                        </p>
                    )}

                    <div className="max-h-[42vh] overflow-y-auto thin-scrollbar rounded-lg border border-borderColor dark:border-darkBorder divide-y divide-borderColor dark:divide-darkBorder">
                        {itemsLoading && (
                            <div className="flex items-center gap-2 p-4 text-xs text-subTextColor dark:text-darkTextSecondary">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Loading {noun.plural} from {def.name} — large accounts
                                can take a little while…
                            </div>
                        )}

                        {!itemsLoading && itemsError && (
                            <div className="p-4">
                                <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                                    {itemsError}
                                </div>
                                <Button
                                    variant="outline2"
                                    size="sm"
                                    className="mt-3"
                                    onClick={onRefreshItems}
                                >
                                    Try again
                                </Button>
                            </div>
                        )}

                        {!itemsLoading && !itemsError && items && items.length === 0 && (
                            <p className="p-4 text-xs text-subTextColor dark:text-darkTextSecondary">
                                No {noun.plural} found in this {def.name} account.
                            </p>
                        )}

                        {!itemsLoading &&
                            !itemsError &&
                            items &&
                            items.length > 0 &&
                            filteredItems.length === 0 && (
                                <p className="p-4 text-xs text-subTextColor dark:text-darkTextSecondary">
                                    No {noun.plural} match your search.
                                </p>
                            )}

                        {!itemsLoading &&
                            !itemsError &&
                            (grouped
                                ? grouped.map((group) => (
                                      <div key={group.key}>
                                          <p className="sticky top-0 z-10 bg-bgSecondary dark:bg-darkPrimaryBg px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary border-b border-borderColor dark:border-darkBorder">
                                              {group.label}
                                          </p>
                                          <div className="divide-y divide-borderColor dark:divide-darkBorder">
                                              {group.rows.map(renderRow)}
                                          </div>
                                      </div>
                                  ))
                                : visibleItems.map(renderRow))}

                        {!itemsLoading && !itemsError && hiddenCount > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                                <span className="text-xs text-subTextColor dark:text-darkTextSecondary">
                                    Showing {visibleItems.length} of{" "}
                                    {filteredItems.length} {noun.plural} — filter to
                                    narrow it down.
                                </span>
                                <Button
                                    variant="outline2"
                                    size="sm"
                                    onClick={() => setShowAllRows(true)}
                                >
                                    Show all
                                </Button>
                            </div>
                        )}
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
                        Import {selected.size > 0 ? selected.size : ""}{" "}
                        {selected.size === 1 ? noun.singular : noun.plural}
                    </Button>
                </DialogFooter>
            )}
        </DialogContent>
    );
};

export default IntegrationPickerDialog;
