/**
 * Pure helpers for the ticket list page (`/support/tickets`): the URL ⇄
 * filter mapping, the "is anything filtered" rules the PNGs imply, the
 * in-place patches the live socket events apply to a row, and the counts
 * arithmetic. No React here, so every rule is unit-testable and shared by
 * the server page and the client container.
 */

import type { IMeta } from "@/types/type";
import type {
  CategoryRef,
  SupportCategory,
  TicketAssignedEvent,
  TicketCounts,
  TicketFeedbackEvent,
  TicketMessageEvent,
  TicketRequesterDetail,
  TicketRequesterSummary,
  TicketStatus,
  TicketStatusChangedEvent,
  TicketUpdatedEvent,
} from "@/types/support";
import { isPriority, isStatus, toMs } from "@/lib/supportGuards";
import { SUPPORT_LIMITS } from "@/zod/supportSchema";

/** Fixed page size as drawn (REQ-U-06 "Requester list page size 5", no selector). */
export const LIST_PAGE_SIZE: number = SUPPORT_LIMITS.LIST_LIMIT_DEFAULT;

/**
 * Deepest page the API serves: `page ≤ 1000` and `(page − 1) × limit ≤ 10 000`
 * (step-2 report §2, 400 beyond). With 5 rows a page that is page 1000.
 */
export const MAX_REACHABLE_PAGE = Math.min(
  SUPPORT_LIMITS.LIST_PAGE_MAX,
  Math.floor(10_000 / LIST_PAGE_SIZE) + 1,
);

/** Search debounce (task: 300 ms; the dropdowns are immediate). */
export const SEARCH_DEBOUNCE_MS = 300;

export interface ListFilters {
  page: number;
  status?: TicketStatus;
  category_id?: number;
  q?: string;
}

export interface ListPage {
  rows: TicketRequesterSummary[];
  meta: IMeta;
}

export const DEFAULT_FILTERS: ListFilters = { page: 1 };

const normaliseQuery = (q: string | undefined) => {
  const trimmed = (q ?? "").trim().slice(0, SUPPORT_LIMITS.SEARCH_MAX);
  return trimmed.length > 0 ? trimmed : undefined;
};

/** Clamp + drop empties so two equal filter sets always serialise the same way. */
export const normaliseFilters = (filters: Partial<ListFilters>): ListFilters => {
  const page = Number.isFinite(filters.page) ? Math.trunc(filters.page as number) : 1;
  return {
    page: Math.min(MAX_REACHABLE_PAGE, Math.max(1, page)),
    status: isStatus(filters.status) ? filters.status : undefined,
    category_id:
      typeof filters.category_id === "number" &&
      Number.isSafeInteger(filters.category_id) &&
      filters.category_id > 0
        ? filters.category_id
        : undefined,
    q: normaliseQuery(filters.q),
  };
};

export const sameFilters = (a: ListFilters, b: ListFilters) =>
  a.page === b.page && a.status === b.status && a.category_id === b.category_id && a.q === b.q;

/** A dropdown filter is set — the chips row exists only then (REQ-U-10; the keyword never becomes a chip). */
export const hasDropdownFilter = (filters: ListFilters) =>
  filters.status !== undefined || filters.category_id !== undefined;

/** Any filter at all (keyword included) — decides first-use vs no-results (REQ-U-03 / REQ-U-11). */
export const hasAnyFilter = (filters: ListFilters) =>
  hasDropdownFilter(filters) || filters.q !== undefined;

/** `?page=2&status=open&category_id=3&q=…` — page 1 and empty values are omitted. */
export const filtersToSearch = (filters: ListFilters): string => {
  const params = new URLSearchParams();
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.status) params.set("status", filters.status);
  if (filters.category_id) params.set("category_id", String(filters.category_id));
  if (filters.q) params.set("q", filters.q);
  const query = params.toString();
  return query ? `?${query}` : "";
};

/**
 * Order-independent form of a query string, so the client can tell whether
 * the URL it mounted on is the one the server rendered (then the server's
 * normalisation wins) or one written later by replaceState (Back restored
 * an older payload: then the URL wins).
 */
export const canonicalQuery = (
  input: URLSearchParams | Record<string, string | string[] | number | undefined>,
): string => {
  const entries: [string, string][] = [];
  if (input instanceof URLSearchParams) {
    input.forEach((value, key) => entries.push([key, value]));
  } else {
    for (const [key, raw] of Object.entries(input)) {
      if (raw === undefined) continue;
      for (const value of Array.isArray(raw) ? raw : [raw]) entries.push([key, String(value)]);
    }
  }
  return entries
    .sort(([a, av], [b, bv]) => (a === b ? av.localeCompare(bv) : a.localeCompare(b)))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
};

/** Pages the pager can reach for a result set (API cap included). */
export const reachablePages = (meta: Pick<IMeta, "total">, limit: number = LIST_PAGE_SIZE) =>
  Math.max(1, Math.min(MAX_REACHABLE_PAGE, Math.ceil(Math.max(0, meta.total) / limit)));

/* ───────────────────────────── categories ───────────────────────────── */

/**
 * Label of the category filter value. A `category_id` that is no longer
 * visible (hidden or deleted server-side, an old bookmark) still gets a
 * name: from a row that carries its `category_ref`, else a neutral label.
 */
export const categoryLabelFor = (
  id: number | undefined,
  categories: SupportCategory[],
  rows: TicketRequesterSummary[] = [],
): string | null => {
  if (id === undefined) return null;
  const visible = categories.find((category) => category.id === id);
  if (visible) return visible.name;
  const fromRow = rows.find((row) => row.category_ref?.id === id)?.category_ref;
  return fromRow?.name ?? "Unavailable category";
};

/* ───────────────────────────── counts ───────────────────────────── */

const clampCount = (value: number) => (Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0);

/** `total` is always the sum of the five buckets (a drifted total never shows). */
export const normaliseCounts = (counts: TicketCounts): TicketCounts => {
  const next = {
    open: clampCount(counts.open),
    in_progress: clampCount(counts.in_progress),
    pending_customer: clampCount(counts.pending_customer),
    resolved: clampCount(counts.resolved),
    closed: clampCount(counts.closed),
    total: 0,
  };
  next.total = next.open + next.in_progress + next.pending_customer + next.resolved + next.closed;
  return next;
};

/** A ticket moved from one status to another (live event) — the refetch reconciles later. */
export const moveCount = (counts: TicketCounts, from: TicketStatus, to: TicketStatus): TicketCounts => {
  if (from === to) return counts;
  return normaliseCounts({ ...counts, [from]: counts[from] - 1, [to]: counts[to] + 1 });
};

/** A ticket was created (always `open`). */
export const addCreated = (counts: TicketCounts): TicketCounts =>
  normaliseCounts({ ...counts, open: counts.open + 1 });

/* ───────────────────────────── rows ───────────────────────────── */

/** The list row of a freshly created ticket (`POST /tickets` answers the detail). */
export const summaryFromDetail = (detail: TicketRequesterDetail): TicketRequesterSummary => ({
  id: detail.id,
  display_number: detail.display_number,
  ticket_number: detail.ticket_number,
  title: detail.title,
  status: detail.status,
  priority: detail.priority,
  category: detail.category,
  category_id: detail.category_id,
  category_ref: detail.category_ref,
  created_at: detail.created_at,
  updated_at: detail.updated_at,
  public_message_count: detail.public_message_count,
  rating: detail.rating,
  agent: detail.agent,
  needs_requester_reply: detail.needs_requester_reply,
  expected_reply_by: detail.expected_reply_by,
  last_message_at: detail.last_message_at,
});

/** Does a (new or patched) row belong to the list the filters describe? Keyword: title or number. */
export const rowMatchesFilters = (row: TicketRequesterSummary, filters: ListFilters): boolean => {
  if (filters.status && row.status !== filters.status) return false;
  if (filters.category_id && row.category_id !== filters.category_id) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const digits = q.replace(/^#|^tkt-?/i, "");
    const numberHit = /^\d+$/.test(digits) && row.ticket_number === Number(digits);
    if (!numberHit && !row.title.toLowerCase().includes(q)) return false;
  }
  return true;
};

/**
 * Optimistic insert after a create: on page 1 of a list the new ticket
 * belongs to, it goes on top (newest first, REQ-U-05) and the page keeps
 * its five rows. Elsewhere the rows stay; only the total moves.
 */
export const insertCreated = (
  page: ListPage,
  row: TicketRequesterSummary,
  filters: ListFilters,
): ListPage => {
  if (page.rows.some((existing) => existing.id === row.id)) return page;
  if (!rowMatchesFilters(row, filters)) return page;
  const total = page.meta.total + 1;
  const meta = {
    ...page.meta,
    total,
    totalPages: Math.max(1, Math.ceil(total / Math.max(1, page.meta.limit || LIST_PAGE_SIZE))),
  };
  if (filters.page !== 1) return { rows: page.rows, meta };
  return { rows: [row, ...page.rows].slice(0, page.meta.limit || LIST_PAGE_SIZE), meta };
};

const patchRow = (
  page: ListPage,
  ticketId: number,
  patch: (row: TicketRequesterSummary) => TicketRequesterSummary,
): ListPage => {
  let changed = false;
  const rows = page.rows.map((row) => {
    if (row.id !== ticketId) return row;
    const next = patch(row);
    if (next !== row) changed = true;
    return next;
  });
  return changed ? { ...page, rows } : page;
};

export const applyStatusChanged = (page: ListPage, event: TicketStatusChangedEvent): ListPage =>
  patchRow(page, event.ticket_id, (row) =>
    row.status === event.to
      ? row
      : {
          ...row,
          status: event.to,
          needs_requester_reply: event.to === "pending_customer",
          updated_at: event.at ?? new Date().toISOString(),
        },
  );

export const applyAssigned = (page: ListPage, event: TicketAssignedEvent): ListPage =>
  patchRow(page, event.ticket_id, (row) => {
    const agent = event.agent
      ? { id: event.agent.id, name: event.agent.name ?? "", image: event.agent.image ?? null }
      : null;
    if ((row.agent?.id ?? null) === (agent?.id ?? null) && row.agent?.name === agent?.name) return row;
    return { ...row, agent };
  });

/** A public reply landed on a ticket (pure — the caller dedupes by message id before calling). */
export const applyMessage = (page: ListPage, event: TicketMessageEvent): ListPage => {
  if (event.kind === "note") return page;
  return patchRow(page, event.ticket_id, (row) => ({
    ...row,
    public_message_count: row.public_message_count + 1,
    last_message_at: event.created_at,
    updated_at: event.created_at,
  }));
};

export const applyFeedback = (page: ListPage, event: TicketFeedbackEvent): ListPage =>
  patchRow(page, event.ticket_id, (row) =>
    row.rating === event.rating ? row : { ...row, rating: event.rating },
  );

/** The fields a `ticket:updated` event can change — shared by a list row and the ticket page. */
type UpdatableTicket = Pick<
  TicketRequesterSummary,
  "priority" | "title" | "category" | "category_id" | "category_ref" | "updated_at"
>;

/**
 * Staff edited priority / category / title (§5.5 "Ticket details update") — the ONE place a
 * `ticket:updated` is applied, for a list row and for the ticket page alike. `changes` arrives
 * narrowed (useSupportSocket); the guard is repeated so a caller cannot slip an unknown priority in.
 * A new category resolves against the visible categories (id first, then slug); one the page does
 * not know (hidden, or no list loaded) takes the slug / id and drops the stale `category_ref`, and
 * the refetch brings its name, icon and colour. Returns `row` itself when nothing changed.
 */
export const applyTicketUpdate = <T extends UpdatableTicket>(
  row: T,
  event: Pick<TicketUpdatedEvent, "changes" | "updated_at">,
  categories: readonly SupportCategory[],
): T => {
  const changes = event.changes ?? {};
  let next = row;
  if (changes.priority && isPriority(changes.priority.to) && changes.priority.to !== row.priority) {
    next = { ...next, priority: changes.priority.to };
  }
  if (changes.title && typeof changes.title.to === "string" && changes.title.to !== row.title) {
    next = { ...next, title: changes.title.to };
  }
  const toId =
    typeof changes.category_id?.to === "number"
      ? changes.category_id.to
      : typeof changes.category?.to === "number"
        ? changes.category.to
        : null;
  const toSlug = typeof changes.category?.to === "string" ? changes.category.to : null;
  const target =
    (toId !== null ? categories.find((c) => c.id === toId) : undefined) ??
    (toSlug !== null ? categories.find((c) => c.slug === toSlug) : undefined);
  if (target) {
    if (target.id !== row.category_id || target.slug !== row.category) {
      const ref: CategoryRef = {
        id: target.id,
        slug: target.slug,
        name: target.name,
        icon: target.icon,
        color: target.color,
      };
      next = { ...next, category_id: target.id, category: target.slug, category_ref: ref };
    }
  } else if ((toSlug !== null && toSlug !== row.category) || (toId !== null && toId !== row.category_id)) {
    const category = toSlug ?? row.category;
    const category_id = toId ?? row.category_id;
    const keepsRef =
      row.category_ref !== null && row.category_ref.slug === category && row.category_ref.id === category_id;
    next = { ...next, category, category_id, category_ref: keepsRef ? row.category_ref : null };
  }
  if (next === row) return row;
  return toMs(event.updated_at) > toMs(row.updated_at) ? { ...next, updated_at: event.updated_at } : next;
};

/** `ticket:updated` on the list page (only the row it names). */
export const applyUpdated = (
  page: ListPage,
  event: TicketUpdatedEvent,
  categories: readonly SupportCategory[],
): ListPage => patchRow(page, event.ticket_id, (row) => applyTicketUpdate(row, event, categories));
