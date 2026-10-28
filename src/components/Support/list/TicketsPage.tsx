"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CircleX, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ticketHref } from "@/lib/support";
import type { SupportCategory, TicketCounts, TicketRequesterDetail } from "@/types/support";
import { useSupportSocket } from "@/socket/useSupportSocket";
import {
  EmptyState,
  STATUS_TOKENS,
  SupportButton,
  notifySupport,
  useLatestRef,
} from "@/components/Support/primitives";
import type { CreateTicketDraft } from "@/components/Support/create/CreateTicketForm";
import { ActiveFiltersRow } from "./ActiveFiltersRow";
import { ListErrorCard } from "./ListErrorCard";
import { SupportHero } from "./SupportHero";
import { TicketFilterBar } from "./TicketFilterBar";
import { TicketTable, TicketTableSkeleton } from "./TicketTable";
import { categoryLabelFor, hasAnyFilter, hasDropdownFilter, type ListFilters, type ListPage } from "./listState";
import { useCooldownSeconds, useTicketList } from "./useTicketList";

const loadCreateDialog = () => import("@/components/Support/create/CreateTicketDialog");

/** The create modal (form, uploader, pickers) only downloads when it is about to open. */
const CreateTicketDialog = dynamic(loadCreateDialog, { ssr: false, loading: () => null });

export interface TicketsPageProps {
  initialFilters: ListFilters;
  initialPage: ListPage | null;
  initialError: string | null;
  initialCounts: TicketCounts | null;
  categories: SupportCategory[];
  categoriesFailed: boolean;
  /** `canonicalQuery` of the request the server rendered for */
  serverQuery: string;
  /** epoch ms of the server render (the socket's first-connect catch-up, §9.4) */
  renderedAt?: number;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Support › My Support Tickets (the 8 user-portal PNGs). Server props are
 * the first paint; everything after — search (300 ms debounce), the two
 * dropdowns, pages, Refresh, live socket updates, create — runs in the
 * browser against the same-origin relay with superseded reads aborted.
 * Every callback handed down is stable and the sections are memoised, so a
 * keystroke in the search re-renders the search input, not the hero, the
 * selects or the rows.
 *
 *  hero (stats card + Live) ─ first use?  EmptyState first-use
 *                           └ else       filter bar · chips row (dropdown filter set)
 *                                         · table | no-results | error card
 */
export const TicketsPage = (props: TicketsPageProps) => {
  const router = useRouter();
  const {
    filters,
    page,
    listError,
    loading,
    counts,
    countsLoading,
    categories,
    categoriesFailed,
    refreshing,
    searchText,
    announcement,
    cooldownUntil,
    setSearchText,
    submitSearch,
    clearSearch,
    setStatus,
    setCategory,
    goToPage: listGoToPage,
    clearAll,
    retryList,
    retryCounts,
    retryCategories,
    refresh,
    onCreated: listOnCreated,
    onCategoriesStale,
    socketHandlers,
  } = useTicketList({
    initialFilters: props.initialFilters,
    initialPage: props.initialPage,
    initialError: props.initialError,
    initialCounts: props.initialCounts,
    initialCategories: props.categories,
    categoriesFailed: props.categoriesFailed,
    serverQuery: props.serverQuery,
  });
  const { connected } = useSupportSocket({ ...socketHandlers, dataAt: props.renderedAt ?? null });
  const waitSeconds = useCooldownSeconds(cooldownUntil);

  /*
   * Focus after a control removes itself (WCAG 2.4.3 — step-9a review: chip ×, "Clear all", the
   * no-results "Clear filters" and the error card's "Try again" all left focus on <body>). The
   * click stores where focus should land; the effect below runs after the commit that removed the
   * control and moves focus there — only if focus was actually lost (still on the control that
   * is gone, or <body>), never away from somewhere the user went meanwhile.
   */
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingFocusRef = useRef<{ resolve: () => HTMLElement | null; origin: Element | null } | null>(null);
  const focusAfterCommit = useCallback((resolve: () => HTMLElement | null) => {
    pendingFocusRef.current = { resolve, origin: document.activeElement };
  }, []);
  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    const active = document.activeElement;
    // The control is still there and focused (e.g. "Clear filters" while the no-results card waits
    // for the new rows): keep waiting for the commit that removes it.
    if (active && active === pending.origin && active.isConnected) return;
    pendingFocusRef.current = null;
    if (active && active !== document.body && active.isConnected) return; // the user moved on
    pending.resolve()?.focus();
  });
  const find = useCallback(
    (selector: string) => rootRef.current?.querySelector<HTMLElement>(selector) ?? null,
    [],
  );
  const focusSearch = useCallback(() => focusAfterCommit(() => find("[data-support-search]")), [find, focusAfterCommit]);

  // "Try again" on the error card: once rows land the card is gone → the table (or the no-results card).
  const retryFocusRef = useRef(false);
  const [createOpen, setCreateOpen] = useState(false);
  // Stays mounted after the first open so the close animation can play.
  const [dialogMounted, setDialogMounted] = useState(false);
  /** the create dialog's unsent text (kept across a close; one copy, written by the form) */
  const [draft, setDraft] = useState<CreateTicketDraft | null>(null);
  const draftNowRef = useLatestRef(draft);
  const createdRef = useRef(false);
  const heroCreateRef = useRef<HTMLButtonElement>(null);
  const tableAnchorRef = useRef<HTMLDivElement>(null);

  const anyFilter = hasAnyFilter(filters);
  const dropdownFilter = hasDropdownFilter(filters);

  // REQ-U-03: zero tickets and nothing filtered → the first-use card replaces filters + table.
  // Not while a read is in flight: right after "Clear filters" the rows on screen still belong to
  // the filtered (empty) query, which flashed the first-use card and took the filter bar — and
  // the keyboard focus headed for its search box — away until the rows arrived (step-9a fixer).
  const firstUse =
    !anyFilter &&
    !loading &&
    ((page !== null && !listError && page.meta.total === 0) || (page === null && counts?.total === 0));

  const openCreate = useCallback(() => {
    createdRef.current = false;
    setDialogMounted(true);
    setCreateOpen(true);
  }, []);

  const warmCreate = useCallback(() => {
    void loadCreateDialog();
  }, []);

  const backgroundRefetch = socketHandlers.refetch;

  const onCreateOpenChange = useCallback(
    (open: boolean) => {
      setCreateOpen(open);
      if (!open) {
        // The unsent text stays for the next open (attachments are dropped with the form). An
        // attempt whose answer was lost may have created the ticket: show it if so.
        if (!createdRef.current && draftNowRef.current?.pendingKey) backgroundRefetch();
        // Focus goes back to the button that opened the dialog (SupportDialog), or to the hero
        // "Create ticket" when that button is gone (returnFocusRef below).
      }
    },
    [backgroundRefetch, draftNowRef],
  );

  const onCreated = useCallback(
    (ticket: TicketRequesterDetail) => {
      createdRef.current = true;
      setDraft(null);
      listOnCreated(ticket);
      setCreateOpen(false);
      // A replayed answer (a retry after a lost response) is still the user's first success.
      notifySupport.success("Ticket created", {
        description: ticket.display_number,
        action: { label: "Open", onClick: () => router.push(ticketHref(ticket.id)) },
      });
    },
    [listOnCreated, router],
  );

  const onRefresh = useCallback(async () => {
    const outcome = await refresh();
    if (outcome === "ok") notifySupport.refreshed();
    else if (outcome === "error") {
      notifySupport.error("Couldn't refresh your tickets", {
        description: "Check your connection and try again.",
        id: "support-refresh-failed",
      });
    }
  }, [refresh]);

  const onRetryCounts = useCallback(() => {
    void retryCounts();
  }, [retryCounts]);

  /** The server already holds this ticket (an earlier attempt went through): close, converge, say so. */
  const onDuplicateDetected = useCallback(() => {
    createdRef.current = true;
    setDraft(null);
    setCreateOpen(false);
    backgroundRefetch();
    notifySupport.info("Ticket already created", {
      description: "Your earlier attempt went through, so we didn't send it twice.",
      id: "support-ticket-duplicate",
    });
  }, [backgroundRefetch]);

  const goToPage = useCallback(
    (pageNumber: number) => {
      listGoToPage(pageNumber);
      // Long card lists (mobile): bring the first new row back into view.
      const anchor = tableAnchorRef.current;
      if (anchor && anchor.getBoundingClientRect().top < 0) {
        anchor.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    },
    [listGoToPage],
  );

  const categoryLabel = categoryLabelFor(filters.category_id, categories, page?.rows ?? []);
  const chips = useMemo(() => {
    const keys: ("status" | "category")[] = [];
    if (filters.status) keys.push("status");
    if (filters.category_id !== undefined && categoryLabel) keys.push("category");
    /** after a chip goes: the chip that took its place, else "Clear all", else that filter's dropdown */
    const removeChip = (index: number, key: "status" | "category") => {
      focusAfterCommit(() => {
        const left = rootRef.current?.querySelectorAll<HTMLElement>("[data-support-chip]");
        return (
          left?.[index] ??
          find("[data-support-clear-all]") ??
          find(key === "status" ? "[data-support-status-trigger]" : "[data-support-category-trigger]")
        );
      });
      if (key === "status") setStatus(undefined);
      else setCategory(undefined);
    };
    return keys.map((key, index) => ({
      key,
      label: key === "status" && filters.status ? STATUS_TOKENS[filters.status].label : (categoryLabel ?? ""),
      onRemove: () => removeChip(index, key),
    }));
  }, [categoryLabel, filters.category_id, filters.status, find, focusAfterCommit, setCategory, setStatus]);

  /** "Clear all" / "Clear filters" also empty the keyword (Q43), so focus goes to the search box. */
  const onClearAll = useCallback(() => {
    focusSearch();
    clearAll();
  }, [clearAll, focusSearch]);

  const onRetryList = useCallback(() => {
    retryFocusRef.current = true;
    retryList();
  }, [retryList]);
  useEffect(() => {
    if (!retryFocusRef.current || loading) return;
    retryFocusRef.current = false;
    if (listError || !page) return; // still failing: the card (and focus on its button) stays
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    (find("[data-support-table]") ?? find("[data-support-empty]") ?? find("[data-support-search]"))?.focus();
  }, [find, listError, loading, page]);

  const createButton = (size: "md" | "lg") => (
    <SupportButton
      size={size}
      icon={<Plus strokeWidth={2} />}
      onClick={openCreate}
      onPointerEnter={warmCreate}
      onFocus={warmCreate}
      aria-haspopup="dialog"
    >
      Create ticket
    </SupportButton>
  );

  let body: ReactNode;
  if (listError) {
    body = <ListErrorCard message={listError} onRetry={onRetryList} retrying={loading} waitSeconds={waitSeconds} />;
  } else if (!page) {
    body = <TicketTableSkeleton />;
  } else if (page.rows.length === 0) {
    body = (
      <EmptyState
        variant="no-results"
        className={cn("transition-opacity duration-150", loading && "opacity-60")}
        actions={
          <>
            <SupportButton variant="outline" icon={<CircleX strokeWidth={2} />} onClick={onClearAll}>
              Clear filters
            </SupportButton>
            {createButton("md")}
          </>
        }
      />
    );
  } else {
    body = <TicketTable page={page} loading={loading} onPageChange={goToPage} />;
  }

  return (
    <div ref={rootRef} className="@container/list flex w-full min-w-0 flex-col gap-6" data-support-list>
      <SupportHero
        ref={heroCreateRef}
        counts={counts}
        countsLoading={countsLoading}
        live={connected}
        refreshing={refreshing}
        onCreate={openCreate}
        onCreateIntent={warmCreate}
        onRefresh={onRefresh}
        onRetryCounts={onRetryCounts}
        refreshWaitSeconds={waitSeconds}
      />

      {firstUse ? (
        <EmptyState variant="first-use" actions={createButton("lg")} />
      ) : (
        <>
          <TicketFilterBar
            searchText={searchText}
            onSearchTextChange={setSearchText}
            onSearchSubmit={submitSearch}
            onSearchClear={clearSearch}
            status={filters.status}
            onStatusChange={setStatus}
            categoryId={filters.category_id}
            categoryLabel={categoryLabel}
            onCategoryChange={setCategory}
            categories={categories}
            counts={counts}
          />
          {dropdownFilter ? (
            <ActiveFiltersRow
              shown={page && !listError ? page.meta.total : null}
              total={counts?.total ?? null}
              chips={chips}
              onClearAll={onClearAll}
            />
          ) : null}
          <div ref={tableAnchorRef} className="scroll-mt-4">
            {body}
          </div>
        </>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {dialogMounted ? (
        <CreateTicketDialog
          open={createOpen}
          onOpenChange={onCreateOpenChange}
          categories={categories}
          categoriesFailed={categoriesFailed}
          onRetryCategories={retryCategories}
          onCategoryHidden={onCategoriesStale}
          onDuplicateDetected={onDuplicateDetected}
          draft={draft}
          onDraftChange={setDraft}
          onCreated={onCreated}
          returnFocusRef={heroCreateRef}
        />
      ) : null}
    </div>
  );
};

export default TicketsPage;
