/**
 * The conversation's state machine (pure — no React, no I/O), so the
 * paging / realtime / optimistic rules are one testable place.
 *
 * Server paging as built (backend services/ticket-read.service.ts): a page
 * is the latest 50 messages below `before` (a message id) plus the public
 * audit lines of the same TIME window — `created_at >= oldest message of the
 * page` when an older page exists, `< created_at of the before message` when
 * `before` is given. Consecutive pages therefore partition the timeline by
 * time (events) and by id (messages) with no gaps or duplicates.
 *
 * The state keeps three layers, rendered in this order:
 *   pages   — every server item loaded so far (older pages + the latest page)
 *   live    — socket messages and locally synthesised event lines that no
 *             server page has confirmed yet, in arrival order
 *   pending — the reply being sent (optimistic bubble), at most one
 *
 * A latest-page refetch supersedes everything in `pages` inside its window
 * and the live entries received before the refetch started; when it cannot
 * prove continuity with what is loaded (more than a page arrived in between)
 * it resets to the fresh page — never a silent gap.
 */

import type { MessageDTO, ThreadPage, TimelineEvent, TimelineItem } from "@/types/support";
import { isRecord, toMs } from "@/lib/supportGuards";

export interface ThreadEntry {
  key: string;
  item: TimelineItem;
  /** epoch ms the payload (and its signed URLs) was obtained */
  obtainedAt: number;
  /** synthesised from a socket event — replaced by the server's audit line on the next refetch */
  local?: boolean;
}

export interface PendingFile {
  localId: string;
  name: string;
  size: number;
  isImage: boolean;
  previewUrl: string | null;
}

export interface PendingReply {
  tempId: string;
  body: string;
  /** pending attachment ids sent with it — matches the server copy when its echo comes first */
  attachmentIds: number[];
  files: PendingFile[];
  createdAt: string;
}

/**
 * Is `message` the server copy of a requester reply with this body and these attachment ids?
 * (Its socket echo can beat the HTTP answer, or arrive after the answer was lost.)
 */
export const isCopyOfReply = (reply: { body: string; attachmentIds: readonly number[] }, message: MessageDTO) => {
  if (message.author.role !== "requester") return false;
  if (message.body.trim() !== reply.body.trim()) return false;
  const ids = message.files.map((file) => file.id).sort((a, b) => a - b);
  const sent = [...reply.attachmentIds].sort((a, b) => a - b);
  return ids.length === sent.length && ids.every((id, index) => id === sent[index]);
};

const isPendingCopy = (pending: PendingReply | null, message: MessageDTO) =>
  pending !== null && isCopyOfReply(pending, message);

export interface ThreadState {
  pages: ThreadEntry[];
  hasMore: boolean;
  nextBefore: number | null;
  live: ThreadEntry[];
  pending: PendingReply | null;
}

export const itemKey = (item: TimelineItem): string =>
  item.type === "message" ? `m:${item.message.id}` : `e:${item.event.id}`;

const entryOf = (item: TimelineItem, obtainedAt: number): ThreadEntry => ({
  key: itemKey(item),
  item,
  obtainedAt,
});

const messageIds = (entries: readonly ThreadEntry[]) =>
  entries.flatMap((entry) => (entry.item.type === "message" ? [entry.item.message.id] : []));

/** min / max without spreading into Math.* (a spread of a very long thread overflows the call stack). */
const minOf = (values: readonly number[]): number | null => {
  let out: number | null = null;
  for (const value of values) if (out === null || value < out) out = value;
  return out;
};
const maxOf = (values: readonly number[]): number | null => {
  let out: number | null = null;
  for (const value of values) if (out === null || value > out) out = value;
  return out;
};

const dedupe = (entries: readonly ThreadEntry[]) => {
  const seen = new Set<string>();
  const out: ThreadEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.key)) continue;
    seen.add(entry.key);
    out.push(entry);
  }
  return out;
};

export const initialThread = (
  timeline: readonly TimelineItem[],
  thread: ThreadPage,
  obtainedAt: number,
): ThreadState => ({
  pages: dedupe(timeline.map((item) => entryOf(item, obtainedAt))),
  hasMore: thread.has_more,
  nextBefore: thread.has_more ? thread.next_before : null,
  live: [],
  pending: null,
});

export type ThreadAction =
  | { type: "older"; timeline: readonly TimelineItem[]; thread: ThreadPage; obtainedAt: number }
  | {
      type: "latest";
      timeline: readonly TimelineItem[];
      thread: ThreadPage;
      obtainedAt: number;
      /** when the refetch request started — live entries received later survive */
      startedAt: number;
    }
  | { type: "liveMessage"; message: MessageDTO; receivedAt: number }
  | { type: "liveEvent"; event: TimelineEvent; receivedAt: number }
  | { type: "pendingStart"; pending: PendingReply }
  | { type: "pendingDone"; tempId: string; message: MessageDTO; receivedAt: number }
  | { type: "pendingFail"; tempId: string };

/** Older page (`?before=`): it sits before everything loaded; its cursor becomes the thread's. */
const applyOlder = (state: ThreadState, action: Extract<ThreadAction, { type: "older" }>): ThreadState => {
  const incoming = action.timeline.map((item) => entryOf(item, action.obtainedAt));
  return {
    ...state,
    pages: dedupe([...incoming, ...state.pages]),
    hasMore: action.thread.has_more,
    nextBefore: action.thread.has_more ? action.thread.next_before : null,
  };
};

const applyLatest = (state: ThreadState, action: Extract<ThreadAction, { type: "latest" }>): ThreadState => {
  const fresh = action.timeline.map((item) => entryOf(item, action.obtainedAt));
  const freshKeys = new Set(fresh.map((entry) => entry.key));
  const survivingLive = (merged: readonly ThreadEntry[]) => {
    const keys = new Set(merged.map((entry) => entry.key));
    return state.live.filter((entry) => {
      if (keys.has(entry.key)) return false;
      // a local line or a message received before the refetch started is
      // either in the fresh page now or was never committed — drop it
      return entry.obtainedAt >= action.startedAt;
    });
  };

  // The fresh page is the whole thread.
  if (!action.thread.has_more) {
    const pages = fresh;
    return { ...state, pages, hasMore: false, nextBefore: null, live: survivingLive(pages) };
  }

  const freshOldestId = minOf(messageIds(fresh));
  const loadedMax = maxOf(messageIds(state.pages));

  // Continuity is proven only when the fresh page overlaps what is loaded.
  const overlaps = freshOldestId !== null && loadedMax !== null && freshOldestId <= loadedMax;
  if (!overlaps) {
    const pages = fresh;
    return {
      ...state,
      pages,
      hasMore: true,
      nextBefore: action.thread.next_before,
      live: survivingLive(pages),
    };
  }

  const oldestFresh = fresh.find(
    (entry) => entry.item.type === "message" && entry.item.message.id === freshOldestId,
  );
  const windowStart = oldestFresh ? toMs(oldestFresh.item.at) : Number.NEGATIVE_INFINITY;
  const kept = state.pages.filter((entry) => {
    if (freshKeys.has(entry.key)) return false;
    if (entry.item.type === "message") return freshOldestId !== null && entry.item.message.id < freshOldestId;
    return toMs(entry.item.at) < windowStart;
  });
  const pages = [...kept, ...fresh];
  return { ...state, pages, live: survivingLive(pages) };
};

const hasKey = (state: ThreadState, key: string) =>
  state.pages.some((entry) => entry.key === key) || state.live.some((entry) => entry.key === key);

/** A message (socket or HTTP answer): replaces a known copy in place, else appends. */
const upsertMessage = (state: ThreadState, message: MessageDTO, receivedAt: number): ThreadState => {
  const item: TimelineItem = { type: "message", at: message.created_at, message };
  const key = itemKey(item);
  if (hasKey(state, key)) {
    const replace = (entries: ThreadEntry[]) =>
      entries.map((entry) =>
        entry.key === key ? { ...entry, item, obtainedAt: Math.max(entry.obtainedAt, receivedAt) } : entry,
      );
    return { ...state, pages: replace(state.pages), live: replace(state.live) };
  }
  return { ...state, live: [...state.live, { key, item, obtainedAt: receivedAt }] };
};

export function threadReducer(state: ThreadState, action: ThreadAction): ThreadState {
  switch (action.type) {
    case "older":
      return applyOlder(state, action);
    case "latest":
      return applyLatest(state, action);
    case "liveMessage": {
      const next = upsertMessage(state, action.message, action.receivedAt);
      // the echo of the reply in flight replaces the optimistic bubble at once (no double for a slow answer)
      return isPendingCopy(state.pending, action.message) ? { ...next, pending: null } : next;
    }
    case "liveEvent": {
      // Pure: the key comes from the event (a synthesised line carries a unique negative id), so
      // Strict Mode's second run of this reducer yields the same entry.
      const item: TimelineItem = { type: "event", at: action.event.at, event: action.event };
      return {
        ...state,
        live: [...state.live, { key: itemKey(item), item, obtainedAt: action.receivedAt, local: true }],
      };
    }
    case "pendingStart":
      return { ...state, pending: action.pending };
    case "pendingDone": {
      const next = upsertMessage(state, action.message, action.receivedAt);
      return state.pending?.tempId === action.tempId ? { ...next, pending: null } : next;
    }
    case "pendingFail":
      return state.pending?.tempId === action.tempId ? { ...state, pending: null } : state;
    default: {
      // a new ThreadAction variant without a case is a compile error here
      const unhandled: never = action;
      void unhandled;
      return state;
    }
  }
}

/** Newest message id in the loaded thread (read receipts). */
export const newestMessageId = (entries: readonly ThreadEntry[]): number | null => maxOf(messageIds(entries));

/* ───────────────────────────── presentation order ───────────────────────────── */

const LEAD_IN_WINDOW_MS = 2_000;

/**
 * Lines that are the CONSEQUENCE of an agent's reply but read better before
 * it: the auto-claim ("Priya joined the conversation", reason `reply_claim`)
 * and the first-reply transition ("Status changed to In progress", trigger
 * `first_reply` / `agent_reply`, or open → in_progress for a live line that
 * carries no trigger). The API writes them in the same transaction as the
 * message and serves them after it (same `at`); TD-01 draws the assignment
 * and the status line above the agent's first message. A "Then set" status
 * (trigger `then_status`) and the requester's own reply keep their order.
 */
const isLeadIn = (entry: ThreadEntry): boolean => {
  if (entry.item.type !== "event") return false;
  const { action, changes } = entry.item.event;
  const c = isRecord(changes) ? changes : {};
  if (action === "TICKET_ASSIGNED") return c.reason === "reply_claim";
  if (action === "STATUS_CHANGED") {
    if (c.trigger === "first_reply" || c.trigger === "agent_reply") return true;
    return c.trigger === undefined && c.from === "open" && c.to === "in_progress";
  }
  return false;
};

/** `entries` with each agent reply's lead-in lines moved in front of it (stable otherwise). */
export function presentationOrder(entries: readonly ThreadEntry[]): ThreadEntry[] {
  const out = [...entries];
  for (let i = 0; i < out.length; i += 1) {
    const entry = out[i];
    if (entry.item.type !== "message" || entry.item.message.author.role !== "agent") continue;
    const at = toMs(entry.item.at);
    let j = i + 1;
    const leadIns: ThreadEntry[] = [];
    while (j < out.length && out[j].item.type === "event" && Math.abs(toMs(out[j].item.at) - at) <= LEAD_IN_WINDOW_MS) {
      if (isLeadIn(out[j])) leadIns.push(out[j]);
      j += 1;
    }
    if (leadIns.length === 0) continue;
    const rest = out.slice(i + 1, j).filter((candidate) => !leadIns.includes(candidate));
    out.splice(i, j - i, ...leadIns, entry, ...rest);
    i += leadIns.length;
  }
  return out;
}
