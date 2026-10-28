"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  parseTicketListFilters,
  supportApi,
  supportErrorMessage,
  SUPPORT_TICKETS_PATH,
  type SupportResult,
} from "@/lib/support";
import { useLatestRequest } from "@/components/Support/primitives";
import { pageRange, ticketsWord } from "@/lib/supportFormat";
import type { IMeta } from "@/types/type";
import type {
  SupportCategory,
  TicketAssignedEvent,
  TicketCounts,
  TicketFeedbackEvent,
  TicketMessageEvent,
  TicketNewEvent,
  TicketRequesterDetail,
  TicketRequesterSummary,
  TicketStatusChangedEvent,
  TicketUpdatedEvent,
} from "@/types/support";
import type { RefetchReason } from "@/socket/useSupportSocket";
import {
  LIST_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  addCreated,
  applyAssigned,
  applyFeedback,
  applyMessage,
  applyStatusChanged,
  applyUpdated,
  canonicalQuery,
  filtersToSearch,
  insertCreated,
  moveCount,
  normaliseCounts,
  normaliseFilters,
  reachablePages,
  sameFilters,
  summaryFromDetail,
  type ListFilters,
  type ListPage,
} from "./listState";

export interface UseTicketListOptions {
  initialFilters: ListFilters;
  initialPage: ListPage | null;
  initialError: string | null;
  initialCounts: TicketCounts | null;
  initialCategories: SupportCategory[];
  categoriesFailed: boolean;
  /** `canonicalQuery` of the URL the server rendered these props for */
  serverQuery: string;
}

export type RefreshOutcome = "ok" | "error" | "superseded";

const fallbackMeta = (page: number, rows: number): IMeta => ({
  page,
  limit: LIST_PAGE_SIZE,
  total: rows,
  totalPages: 1,
});

/** "Showing 1–5 of 7 tickets" — the polite live-region sentence after a load. */
export const resultSummary = (page: ListPage | null): string => {
  if (!page) return "";
  const { meta } = page;
  if (meta.total === 0 || page.rows.length === 0) return "No tickets match these filters.";
  const range = pageRange(meta.page, meta.limit || LIST_PAGE_SIZE, meta.total);
  return `Showing ${range.label} of ${meta.total} ${ticketsWord(meta.total)}`;
};

/** One page of the list for these filters (both lanes). */
const readList = (next: ListFilters, signal: AbortSignal) =>
  supportApi.listTickets(
    {
      page: next.page,
      limit: LIST_PAGE_SIZE,
      status: next.status,
      category_id: next.category_id,
      q: next.q,
    },
    { signal },
  );

const countsSentence = (counts: TicketCounts) =>
  `Ticket counts updated: ${counts.open} open, ${counts.in_progress} in progress, ` +
  `${counts.pending_customer} waiting on you, ${counts.resolved} resolved, ${counts.closed} closed.`;

/**
 * `user` — a filter / search / page / Retry: rows dim, a failure shows the error card, the result
 * is announced. `silent` — the hero Refresh: same lane, no dimming, the caller toasts.
 * Background (socket) reads use their own lane (`loadListInBackground`).
 */
type LoadMode = "user" | "silent";

/** What the in-place handlers could not converge themselves (read by the next background refetch). */
interface ConvergeNeeds {
  list: boolean;
  counts: boolean;
}

/**
 * State of the list page: the filters (mirrored to the URL with
 * `history.replaceState` — no RSC round trip per keystroke, plan §2.2), the
 * current page of rows, the global counts and the categories. Every read is
 * abortable and a superseded read is cancelled (`useLatestRequest`); socket
 * events patch rows and counts in place and the socket hook's debounced
 * refetch converges them. Safe under React Strict Mode's double effects.
 *
 * Two lanes (step-9a review): user reads (filters, search, pages, Retry,
 * Refresh) and background reads (socket convergence, reconnect, tab visible).
 * A background read never aborts a user read — it is skipped while one is in
 * flight and dropped if the filters moved while it ran — so a socket event
 * can no longer swallow a filter load's error card or its announcement.
 * Each live handler reports whether the visible data still needs the server
 * (`false` = applied exactly in place); the refetch reads only what is needed.
 */
export function useTicketList(options: UseTicketListOptions) {
  const initialFiltersRef = useRef(normaliseFilters(options.initialFilters));
  const serverQueryRef = useRef(options.serverQuery);
  const [filters, setFilters] = useState<ListFilters>(initialFiltersRef.current);
  const [page, setPage] = useState<ListPage | null>(options.initialPage);
  const [listError, setListError] = useState<string | null>(options.initialError);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<TicketCounts | null>(() =>
    options.initialCounts ? normaliseCounts(options.initialCounts) : null,
  );
  const [countsLoading, setCountsLoading] = useState(false);
  const [categories, setCategories] = useState<SupportCategory[]>(options.initialCategories);
  const [categoriesFailed, setCategoriesFailed] = useState(options.categoriesFailed);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchTextState] = useState(initialFiltersRef.current.q ?? "");
  const [announcement, setAnnouncement] = useState("");
  /** epoch ms until which Retry / Refresh wait (a 429's Retry-After), null when free */
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  const { run: runList } = useLatestRequest();
  const { run: runBackgroundList, abort: abortBackgroundList } = useLatestRequest();
  const { run: runCounts } = useLatestRequest();
  const { run: runCategories } = useLatestRequest();

  const pageRef = useRef(page);
  const userListLoadsRef = useRef(0);
  const cooldownRef = useRef(0);
  const needsRef = useRef<ConvergeNeeds>({ list: false, counts: false });
  const filtersRef = useRef(filters);
  const searchTextRef = useRef(searchText);
  const categoriesRef = useRef(categories);
  const seenMessagesRef = useRef(new Set<number>());
  const seenStatusEventsRef = useRef(new Set<string>());
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countsAnnounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const noteRetryAfter = useCallback((result: SupportResult<unknown>) => {
    if (result.ok || !result.retryAfterMs) return;
    const until = Date.now() + result.retryAfterMs;
    if (until <= cooldownRef.current) return;
    cooldownRef.current = until;
    setCooldownUntil(until);
  }, []);

  /* ── URL mirror ── */
  const writeUrl = useCallback((next: ListFilters) => {
    if (typeof window === "undefined") return;
    const target = `${SUPPORT_TICKETS_PATH}${filtersToSearch(next)}`;
    if (`${window.location.pathname}${window.location.search}` === target) return;
    // Next 15 keeps useSearchParams in sync with the native history API.
    window.history.replaceState(null, "", target);
  }, []);

  const commitFilters = useCallback(
    (next: ListFilters) => {
      filtersRef.current = next;
      setFilters(next);
      writeUrl(next);
    },
    [writeUrl],
  );

  /* ── reads ── */
  const loadList = useCallback(
    async (next: ListFilters, mode: LoadMode = "user"): Promise<SupportResult<TicketRequesterSummary[]> | null> => {
      if (mode === "user") setLoading(true);
      // A user read supersedes any background read: its rows would describe older filters.
      abortBackgroundList();
      userListLoadsRef.current += 1;
      let result: SupportResult<TicketRequesterSummary[]>;
      try {
        result = await runList((signal) => readList(next, signal));
      } finally {
        userListLoadsRef.current -= 1;
      }
      // Superseded by a newer read (or unmounted): that read settles the state.
      if (!result.ok && result.aborted) return null;
      setLoading(false);
      if (!result.ok) {
        noteRetryAfter(result);
        // A user action shows its error in place of rows that no longer match;
        // Refresh keeps the rows on screen (its toast says it failed).
        if (mode === "user") setListError(supportErrorMessage(result, "We couldn't load your tickets."));
        return result;
      }
      const meta = result.meta ?? fallbackMeta(next.page, result.data.length);
      // Past the last page (tickets left the filter meanwhile): land on the last one.
      const last = reachablePages(meta);
      if (result.data.length === 0 && meta.total > 0 && next.page > last) {
        const clamped = { ...next, page: last };
        commitFilters(clamped);
        return loadList(clamped, mode);
      }
      const nextPage: ListPage = { rows: result.data, meta };
      setListError(null);
      setPage(nextPage);
      if (mode === "user") setAnnouncement(resultSummary(nextPage));
      return result;
    },
    [abortBackgroundList, commitFilters, noteRetryAfter, runList],
  );

  /**
   * Socket convergence / reconnect / tab visible. Skipped while a user read is in flight (it brings
   * fresh rows) or while a Retry-After holds; dropped when the filters moved meanwhile; a failure
   * keeps what is on screen. A background success also clears a stale error card.
   */
  const loadListInBackground = useCallback(async () => {
    if (userListLoadsRef.current > 0 || Date.now() < cooldownRef.current) return;
    const requested = filtersRef.current;
    const result = await runBackgroundList((signal) => readList(requested, signal));
    if (!result.ok) {
      if (!result.aborted) noteRetryAfter(result);
      return;
    }
    if (userListLoadsRef.current > 0 || filtersRef.current !== requested) return;
    const meta = result.meta ?? fallbackMeta(requested.page, result.data.length);
    const last = reachablePages(meta);
    if (result.data.length === 0 && meta.total > 0 && requested.page > last) {
      // the rows left this page (e.g. resolved elsewhere): land on the last page like a user read
      const clamped = { ...requested, page: last };
      commitFilters(clamped);
      void loadList(clamped, "silent");
      return;
    }
    setListError(null);
    setPage({ rows: result.data, meta });
  }, [commitFilters, loadList, noteRetryAfter, runBackgroundList]);

  const loadCounts = useCallback(async (): Promise<SupportResult<TicketCounts> | null> => {
    setCountsLoading(true);
    const result = await runCounts((signal) => supportApi.getCounts({ signal }));
    if (!result.ok && result.aborted) return null;
    setCountsLoading(false);
    // A failed refetch keeps the counts on screen; with none yet the card shows its retry state.
    if (result.ok) setCounts(normaliseCounts(result.data));
    else noteRetryAfter(result);
    return result;
  }, [noteRetryAfter, runCounts]);

  const loadCategories = useCallback(async () => {
    const result = await runCategories((signal) => supportApi.getCategories({ signal }));
    if (!result.ok && result.aborted) return null;
    if (result.ok) {
      setCategories(result.data);
      setCategoriesFailed(false);
    } else {
      setCategoriesFailed(true);
    }
    return result;
  }, [runCategories]);

  /* ── filter changes ── */
  const applyFilters = useCallback(
    (patch: Partial<ListFilters>) => {
      const next = normaliseFilters({ ...filtersRef.current, ...patch });
      if (sameFilters(next, filtersRef.current)) return;
      commitFilters(next);
      void loadList(next, "user");
    },
    [commitFilters, loadList],
  );

  const clearSearchTimer = useCallback(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, []);

  const writeSearchText = useCallback((text: string) => {
    searchTextRef.current = text;
    setSearchTextState(text);
  }, []);

  /** Typing: the input updates now, the query 300 ms after the last keystroke (back to page 1). */
  const setSearchText = useCallback(
    (text: string) => {
      writeSearchText(text);
      clearSearchTimer();
      searchTimerRef.current = setTimeout(() => {
        searchTimerRef.current = null;
        applyFilters({ q: text, page: 1 });
      }, SEARCH_DEBOUNCE_MS);
    },
    [applyFilters, clearSearchTimer, writeSearchText],
  );

  /** Enter in the search box: apply now instead of waiting for the debounce. */
  const submitSearch = useCallback(() => {
    clearSearchTimer();
    applyFilters({ q: searchTextRef.current, page: 1 });
  }, [applyFilters, clearSearchTimer]);

  const clearSearch = useCallback(() => {
    clearSearchTimer();
    writeSearchText("");
    applyFilters({ q: undefined, page: 1 });
  }, [applyFilters, clearSearchTimer, writeSearchText]);

  const setStatus = useCallback(
    (status: ListFilters["status"]) => applyFilters({ status, page: 1 }),
    [applyFilters],
  );

  const setCategory = useCallback(
    (category_id: ListFilters["category_id"]) => applyFilters({ category_id, page: 1 }),
    [applyFilters],
  );

  const goToPage = useCallback((pageNumber: number) => applyFilters({ page: pageNumber }), [applyFilters]);

  /**
   * "Clear all" (chips row) and "Clear filters" (no-results card) reset the
   * status, the category AND the keyword — the no-results copy promises
   * "every ticket" (plan §10 Q43, recommended answer).
   */
  const clearAll = useCallback(() => {
    clearSearchTimer();
    writeSearchText("");
    applyFilters({ status: undefined, category_id: undefined, q: undefined, page: 1 });
  }, [applyFilters, clearSearchTimer, writeSearchText]);

  /** Retry after a failed list read (filters kept). */
  const retryList = useCallback(() => {
    void loadList(filtersRef.current, "user");
  }, [loadList]);

  /** Hero Refresh: list + counts (+ categories when they failed) in parallel; the caller toasts. */
  const refresh = useCallback(async (): Promise<RefreshOutcome> => {
    setRefreshing(true);
    const [list, countsResult] = await Promise.all([
      loadList(filtersRef.current, "silent"),
      loadCounts(),
      categoriesFailed ? loadCategories() : Promise.resolve(null),
    ]);
    setRefreshing(false);
    if (list === null) return "superseded";
    if (list.ok) {
      setAnnouncement(
        resultSummary({ rows: list.data, meta: list.meta ?? fallbackMeta(filtersRef.current.page, list.data.length) }),
      );
    }
    return list.ok && (countsResult === null || countsResult.ok) ? "ok" : "error";
  }, [categoriesFailed, loadCategories, loadCounts, loadList]);

  /**
   * Socket-driven convergence (`useSupportSocket` debounces it ≥ 5 s + jitter). After events it
   * reads only what the in-place handlers flagged; after a reconnect / a return to the tab /
   * a direct call (create dialog closed on an unknown outcome) it reads both, since events may
   * have been missed.
   */
  const backgroundRefetch = useCallback(
    (reason: RefetchReason = "direct") => {
      const needs = needsRef.current;
      needsRef.current = { list: false, counts: false };
      const all = reason !== "events" || (!needs.list && !needs.counts);
      if (all || needs.list) void loadListInBackground();
      if ((all || needs.counts) && Date.now() >= cooldownRef.current) void loadCounts();
    },
    [loadCounts, loadListInBackground],
  );

  /** Marks what the next event refetch must read; returns whether one is needed at all. */
  const need = useCallback((list: boolean, counts: boolean): boolean => {
    if (list) needsRef.current.list = true;
    if (counts) needsRef.current.counts = true;
    return list || counts;
  }, []);
  const onPage = useCallback(
    (ticketId: number) => pageRef.current?.rows.some((row) => row.id === ticketId) ?? false,
    [],
  );

  /* ── create (optimistic row) ── */
  const onCreated = useCallback((detail: TicketRequesterDetail) => {
    const row = summaryFromDetail(detail);
    setPage((current) =>
      insertCreated(current ?? { rows: [], meta: fallbackMeta(1, 0) }, row, filtersRef.current),
    );
    setListError(null);
    setCounts((current) => (current ? addCreated(current) : current));
  }, []);

  /** A category the server refused (CATEGORY_HIDDEN on create): re-read the visible ones. */
  const onCategoriesStale = useCallback(() => {
    void loadCategories();
  }, [loadCategories]);

  /* ── live events (applied in place) ── */
  const announceCountsSoon = useCallback((next: TicketCounts) => {
    if (countsAnnounceTimerRef.current) clearTimeout(countsAnnounceTimerRef.current);
    countsAnnounceTimerRef.current = setTimeout(() => {
      countsAnnounceTimerRef.current = null;
      setAnnouncement(countsSentence(next));
    }, 1500);
  }, []);

  const onStatusChanged = useCallback(
    (event: TicketStatusChangedEvent): boolean => {
      setPage((current) => (current ? applyStatusChanged(current, event) : current));
      // A redelivered event must not move the counts twice.
      const key = `${event.ticket_id}:${event.from}:${event.to}:${event.at ?? ""}`;
      if (seenStatusEventsRef.current.has(key)) return false;
      if (seenStatusEventsRef.current.size > 500) seenStatusEventsRef.current.clear();
      seenStatusEventsRef.current.add(key);
      setCounts((current) => (current ? moveCount(current, event.from, event.to) : current));
      // Counts moved exactly; the rows only need the server when a status filter decides membership.
      return need(filtersRef.current.status !== undefined, false);
    },
    [need],
  );

  // The counts sentence follows the counts it describes (never computed inside a state updater).
  const liveCountsRef = useRef<TicketCounts | null>(null);
  useEffect(() => {
    if (!counts) return;
    const previous = liveCountsRef.current;
    liveCountsRef.current = counts;
    if (previous && previous.total === counts.total && previous !== counts) {
      const moved =
        previous.open !== counts.open ||
        previous.in_progress !== counts.in_progress ||
        previous.pending_customer !== counts.pending_customer ||
        previous.resolved !== counts.resolved ||
        previous.closed !== counts.closed;
      if (moved) announceCountsSoon(counts);
    }
  }, [announceCountsSoon, counts]);

  const onAssigned = useCallback(
    (event: TicketAssignedEvent): boolean => {
      setPage((current) => (current ? applyAssigned(current, event) : current));
      // No assignee filter: membership never changes; only an unnamed agent on screen needs the server.
      return need(onPage(event.ticket_id) && event.agent !== null && !event.agent.name, false);
    },
    [need, onPage],
  );

  const onMessage = useCallback((event: TicketMessageEvent): boolean => {
    // Dedupe OUTSIDE the state updater (updaters must stay pure: Strict Mode runs them twice).
    const seen = seenMessagesRef.current;
    if (seen.has(event.id)) return false;
    if (seen.size > 2000) seen.clear();
    seen.add(event.id);
    setPage((current) => (current ? applyMessage(current, event) : current));
    // A reply changes no status, filter membership or ordering (by created_at): the row (if shown)
    // is patched in place, counts are unchanged — nothing to re-read, on this page or another.
    return false;
  }, []);

  const onFeedback = useCallback((event: TicketFeedbackEvent): boolean => {
    setPage((current) => (current ? applyFeedback(current, event) : current));
    return false;
  }, []);

  const onUpdated = useCallback(
    (event: TicketUpdatedEvent): boolean => {
      setPage((current) => (current ? applyUpdated(current, event, categoriesRef.current) : current));
      const changes = event.changes ?? {};
      const filters = filtersRef.current;
      // Category / title edits can move a ticket in or out of a category filter or a keyword
      // search; a new category on a shown row brings its name / icon / colour with the read.
      const membership =
        (filters.category_id !== undefined && changes.category !== undefined) ||
        (filters.q !== undefined && changes.title !== undefined);
      return need(membership || (onPage(event.ticket_id) && changes.category !== undefined), false);
    },
    [need, onPage],
  );

  /** A ticket created elsewhere (another tab, or staff on the requester's behalf): new row + counts. */
  const onNew = useCallback((event: TicketNewEvent): boolean => need(event.id > 0, true), [need]);

  /*
   * A later server render (soft navigation to another query, or a refresh
   * caused by a server action that revalidated) delivers NEW props to this
   * same instance. When they describe the URL the browser shows, adopt them:
   * fresh rows, counts and categories, the filters they were read with. A
   * payload for another URL (stale) is ignored. Transient UI state — the
   * create dialog, a debounce in flight — is untouched.
   */
  const firstPropsRef = useRef(options);
  useEffect(() => {
    if (firstPropsRef.current === options) return;
    const first = firstPropsRef.current;
    if (
      first.initialPage === options.initialPage &&
      first.initialCounts === options.initialCounts &&
      first.initialCategories === options.initialCategories &&
      first.initialError === options.initialError &&
      first.serverQuery === options.serverQuery
    ) {
      return; // same server payload, only the options object is new
    }
    firstPropsRef.current = options;
    const search = canonicalQuery(new URLSearchParams(window.location.search));
    if (search !== options.serverQuery) return;
    const next = normaliseFilters(options.initialFilters);
    initialFiltersRef.current = next;
    serverQueryRef.current = options.serverQuery;
    filtersRef.current = next;
    setFilters(next);
    if (options.initialPage) {
      setPage(options.initialPage);
      setListError(null);
    } else if (options.initialError) {
      setListError(options.initialError);
    }
    if (options.initialCounts) setCounts(normaliseCounts(options.initialCounts));
    if (!options.categoriesFailed) {
      setCategories(options.initialCategories);
      setCategoriesFailed(false);
    }
    if (!searchTimerRef.current) writeSearchText(next.q ?? "");
  }, [options, writeSearchText]);

  /*
   * The URL the page mounts on is the one the server rendered → keep the
   * server's normalisation (clamped page, junk dropped, slug → id) and write
   * it back. A different URL means the router restored an older payload
   * (Back from a ticket) after this page had written newer filters with
   * replaceState → trust the URL and read it. Compared with the SERVER
   * filters (not the live ones) so Strict Mode's second effect run repeats a
   * read its simulated unmount aborted.
   */
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const fromUrl = normaliseFilters(parseTicketListFilters(search));
    if (canonicalQuery(search) !== serverQueryRef.current && !sameFilters(fromUrl, initialFiltersRef.current)) {
      commitFilters(fromUrl);
      writeSearchText(fromUrl.q ?? "");
      void loadList(fromUrl, "user");
    } else {
      // Canonical URL for what the server parsed (clamped page, junk dropped, slug → id).
      writeUrl(initialFiltersRef.current);
    }
  }, [commitFilters, loadList, writeSearchText, writeUrl]);

  useEffect(
    () => () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (countsAnnounceTimerRef.current) clearTimeout(countsAnnounceTimerRef.current);
    },
    [],
  );

  const socketHandlers = useMemo(
    () => ({ onNew, onStatusChanged, onAssigned, onMessage, onFeedback, onUpdated, refetch: backgroundRefetch }),
    [backgroundRefetch, onAssigned, onFeedback, onMessage, onNew, onStatusChanged, onUpdated],
  );

  return {
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
    goToPage,
    clearAll,
    retryList,
    retryCounts: loadCounts,
    retryCategories: loadCategories,
    refresh,
    onCreated,
    onCategoriesStale,
    socketHandlers,
  };
}

export type TicketListState = ReturnType<typeof useTicketList>;

/**
 * Seconds left until `until` (epoch ms), re-rendered once a second while > 0 and 0 afterwards —
 * the Retry-After hold of the list's Retry and the hero's Refresh. The interval is cleared as soon
 * as the hold is over and on unmount.
 */
export function useCooldownSeconds(until: number | null): number {
  const left = () => (until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0);
  const [seconds, setSeconds] = useState(left);
  useEffect(() => {
    const tick = () => {
      const next = until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0;
      setSeconds(next);
      return next;
    };
    if (tick() === 0) return;
    const timer = setInterval(() => {
      if (tick() === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [until]);
  return seconds;
}
