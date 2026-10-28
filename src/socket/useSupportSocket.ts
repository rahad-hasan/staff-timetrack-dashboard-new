"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Socket } from "socket.io-client";
import { socket as defaultSocket } from "@/socket/socket";
import type {
  SupportSocketEventMap,
  SupportSocketEventName,
  TicketAssignedEvent,
  TicketFeedbackEvent,
  TicketMessageEvent,
  TicketNewEvent,
  TicketStatusChangedEvent,
  TicketUpdatedEvent,
} from "@/types/support";
import { SUPPORT_SOCKET_EVENTS } from "@/types/support";
import { asInt, asPriority, asStatus, isRecord } from "@/lib/supportGuards";
import { narrowPostedMessage } from "@/zod/supportSchema";
import { useLatestRef } from "@/components/Support/primitives/useLatestRef";

/**
 * Realtime for the requester screens (blueprint §9, §5.5).
 *
 * - Listens on the dashboard's shared DEFAULT-namespace socket (connected by
 *   `SocketProvider` with the session token) to `ticket:new|message|
 *   status_changed|assigned|feedback|updated`, narrows each payload and hands
 *   it to the caller's handler so the UI applies it IN PLACE (pill, agent
 *   card, message appended).
 * - After any event it also schedules ONE refetch, coalesced to at least
 *   `minRefetchDelayMs` (5 s) + jitter after the first event of a burst, so
 *   derived data (counts, ordering, read marks) converges without a storm
 *   when staff bulk-update.
 * - Reconnect (`manager.reconnect`) and the tab becoming visible again
 *   refetch promptly (throttled), because events were missed meanwhile.
 * - `ticketId` joins the `ticket:<id>` room (`join:ticket`, ack-checked) and
 *   drops events of other tickets; the room is left on unmount.
 * - The `/support` namespace of §9.1 (backend step 5) is multiplexed on the
 *   same Manager. It is ON by default (step 9c); `NEXT_PUBLIC_SUPPORT_SOCKET_NS`
 *   set to `false` / `0` / `off` / `no` at build time turns it off. It then
 *   becomes the ONLY source of ticket events (join:ticket goes there too), so a
 *   change is never applied twice. If the server refuses it ("Invalid
 *   namespace": backend `SUPPORT_SOCKET_NS=false`, or a realtime build older
 *   than step 5) the page falls back to the default namespace. The other
 *   handshake refusals follow the step-5 client contract (§9 of its report):
 *   `TOO_MANY_CONNECTIONS` backs off ≥ 30 s — and the page listens on the
 *   default namespace meanwhile, so it stays live — `Unauthorized` retries a few
 *   times with a long backoff (the token may have been replaced), `ACCOUNT_*`
 *   stops (the HTTP 401 path signs the user out). A refused `join:ticket` is
 *   retried on `rate_limited` (2 s) and `server_error`.
 * - Handlers must be idempotent anyway (dedupe messages by id): the HTTP
 *   answer of the user's own reply and its `ticket:message` echo both
 *   arrive. A handler that applied an event EXACTLY in place returns `false`
 *   and no refetch is scheduled for it (step-9a review, §19.3 "event-driven
 *   refetch amplification": the requester's own reply echo, an off-page row).
 * - Catch-up: the first `connect` after mount refetches (jittered) when the
 *   page's data is older than 2 s — events between the server render and the
 *   socket connect are otherwise lost (§9.4). Reconnects refetch with a 0…
 *   jitter delay (no herd after a realtime restart); a return to the tab
 *   refetches only when it was hidden longer than the floor or an event
 *   arrived while hidden.
 * - On the `/support` namespace (flag on, step-5 realtime) a ticket page also
 *   sends `presence:heartbeat { id }` every 20 s while visible ("Requester is
 *   viewing" in the console) and can send read receipts as `ticket:read`
 *   (Redis + worker flush, no Postgres write on the request path) — the
 *   caller falls back to `POST /tickets/:id/read` when `emitRead` resolves
 *   false, and `emitTyping` drives the console's "<requester> is typing" line
 *   (`ticket:typing { id, is_typing }`). The default namespace has none of
 *   these handlers, so nothing is sent there.
 *
 * Every listener, timer and room membership is removed on unmount.
 */

/**
 * A handler returns `false` when it applied the event exactly in place (nothing for a refetch to
 * converge); anything else (`true`, `undefined`) schedules the coalesced refetch.
 */
type Handled = boolean | void;

export interface SupportSocketHandlers {
  onNew?: (event: TicketNewEvent) => Handled;
  onMessage?: (event: TicketMessageEvent) => Handled;
  onStatusChanged?: (event: TicketStatusChangedEvent) => Handled;
  onAssigned?: (event: TicketAssignedEvent) => Handled;
  onFeedback?: (event: TicketFeedbackEvent) => Handled;
  onUpdated?: (event: TicketUpdatedEvent) => Handled;
  /** the transport reconnected — events may have been missed */
  onReconnect?: () => void;
}

/** Why a refetch runs: after `events` only what the handlers flagged is stale; otherwise anything may be. */
export type RefetchReason = "events" | "reconnect" | "visible" | "connect" | "direct";

export interface UseSupportSocketOptions extends SupportSocketHandlers {
  /**
   * Re-reads the data the page shows. Called (a) coalesced ≥ 5 s + jitter
   * after an event burst, (b) after a reconnect, (c) when the tab becomes
   * visible again, (d) after the first connect when the data predates it —
   * with the reason. Should be stable or ref-wrapped.
   */
  refetch?: (reason: RefetchReason) => void | Promise<unknown>;
  /** join this ticket's room and ignore other tickets' events */
  ticketId?: number | null;
  /**
   * epoch ms (server clock) the page's data was read at — the server render. The first connect
   * after mount refetches when that is more than 2 s ago (or the clocks disagree by over a minute).
   */
  dataAt?: number | null;
  enabled?: boolean;
  /**
   * debounce floor (ms): an event-driven refetch lands this long (+ jitter)
   * after the first event of a burst, and a reconnect/visibility refetch
   * never runs sooner than this after the previous one — never below 1000
   */
  minRefetchDelayMs?: number;
  /** random extra delay added to the floor (ms) */
  refetchJitterMs?: number;
}

export interface SupportSocketState {
  /** the event source is connected — drives the "● Live" pill */
  connected: boolean;
  /** the /support namespace is in use (step 5 flag) */
  supportNamespace: boolean;
  /**
   * `ticket:read { id, last_read_message_id }` on the `/support` namespace (ticket pages only).
   * Waits up to 3 s for the ticket room's join (a read ready at page load), then resolves true when
   * the server acked it; false when it could not be sent that way (default namespace, not joined in
   * time, refused, no ack in 3 s) — the caller then uses the HTTP endpoint.
   * Stable identity.
   */
  emitRead: (lastReadMessageId: number) => Promise<boolean>;
  /**
   * `ticket:typing { id, is_typing }` on the `/support` namespace (ticket pages only; the server
   * relays it to the staff viewing the ticket, sender excluded). A no-op on the default namespace,
   * while disconnected or before the room is joined. Stable identity; the caller throttles.
   */
  emitTyping: (isTyping: boolean) => void;
}

interface JoinAck {
  ok?: boolean;
  error?: string;
}

/**
 * Build-time flag, ON unless explicitly switched off (step 9c, after the step-5 realtime shipped
 * the namespace): unset / empty / anything else → on; `false` / `0` / `off` / `no` → off.
 */
const SUPPORT_NS_ENABLED = !["0", "false", "off", "no"].includes(
  (process.env.NEXT_PUBLIC_SUPPORT_SOCKET_NS ?? "").trim().toLowerCase(),
);

/** §9.3: the client sends `presence:heartbeat` every 20 s while the ticket page is visible. */
const PRESENCE_HEARTBEAT_MS = 20_000;
/** a `ticket:read` without an ack in this long falls back to HTTP */
const READ_ACK_TIMEOUT_MS = 3_000;
/** data older than this at the first connect may have missed events (§9.4 catch-up) */
const STALE_AT_CONNECT_MS = 2_000;
/** step-5 contract: `join:ticket` → `rate_limited` is retried after 2 s */
const JOIN_RATE_LIMITED_RETRY_MS = 2_000;
/** `join:ticket` → `server_error` (Redis / Postgres hiccup): retried with this backoff, then given up */
const JOIN_SERVER_ERROR_RETRY_MS = [3_000, 10_000, 30_000];
/** step-5 contract: `TOO_MANY_CONNECTIONS` backs off ≥ 30 s (socket.io never retries a middleware refusal) */
const TOO_MANY_CONNECTIONS_BACKOFF_MS = 30_000;
/** `Unauthorized`: the session may have been replaced meanwhile — a few slow retries, then stop */
const UNAUTHORIZED_RETRY_MS = [30_000, 120_000, 300_000];

/* ───────────────────────────── payload narrowing ───────────────────────────── */

const asString = (value: unknown): string | null => (typeof value === "string" ? value : null);

/**
 * One `{ from, to }` pair of a `ticket:updated` change, kept only when `to` is a valid value (an
 * unknown priority from a newer backend is dropped here instead of reaching a lookup table).
 */
const changePair = <T,>(raw: unknown, read: (value: unknown) => T | null): { from: T | null; to: T } | undefined => {
  if (!isRecord(raw)) return undefined;
  const to = read(raw.to);
  return to === null ? undefined : { from: read(raw.from), to };
};

const asSlugOrId = (value: unknown): string | number | null => asString(value) ?? asInt(value);

/** The `/support` shape of a category side: `{ id, slug }` (either may be null). */
const categoryRefOf = (value: unknown): { id: number | null; slug: string | null } | null =>
  isRecord(value) ? { id: asInt(value.id), slug: asString(value.slug) } : null;

/**
 * `changes.category` comes in two shapes: the default namespace's slug (or id) plus a separate
 * `category_id` pair, and the `/support` namespace's one pair of `{ id, slug }` refs (backend
 * realtime/payloads.ts `ticketChangesPayload`). Both are folded into the slug + id pairs the UI
 * applies; a ref side without a usable value is dropped like any other invalid `to`.
 */
const narrowCategoryChanges = (
  raw: unknown,
  rawId: unknown,
): Pick<TicketUpdatedEvent["changes"], "category" | "category_id"> => {
  const out: Pick<TicketUpdatedEvent["changes"], "category" | "category_id"> = {};
  const to = isRecord(raw) ? categoryRefOf(raw.to) : null;
  if (isRecord(raw) && to) {
    const from = categoryRefOf(raw.from);
    if (to.slug !== null) out.category = { from: from?.slug ?? from?.id ?? null, to: to.slug };
    else if (to.id !== null) out.category = { from: from?.id ?? null, to: to.id };
    if (to.id !== null) out.category_id = { from: from?.id ?? null, to: to.id };
    return out;
  }
  const category = changePair(raw, asSlugOrId);
  const categoryId = changePair(rawId, asInt);
  if (category) out.category = category;
  if (categoryId) out.category_id = categoryId;
  return out;
};

const narrowChanges = (raw: Record<string, unknown>): TicketUpdatedEvent["changes"] => {
  const changes: TicketUpdatedEvent["changes"] = narrowCategoryChanges(raw.category, raw.category_id);
  const priority = changePair(raw.priority, asPriority);
  const title = changePair(raw.title, asString);
  if (priority) changes.priority = priority;
  if (title) changes.title = title;
  return changes;
};

/** The ticket a payload belongs to: v1 `ticket_id`, else the §9.3 `id` (not for messages, whose `id` is the message). */
const ticketIdOf = (name: SupportSocketEventName, raw: Record<string, unknown>): number | null => {
  const explicit = asInt(raw.ticket_id);
  if (explicit !== null) return explicit;
  return name === "ticket:message" ? null : asInt(raw.id);
};

type Narrowed = { [K in SupportSocketEventName]: SupportSocketEventMap[K] | null };

const narrowEvent = <K extends SupportSocketEventName>(name: K, raw: unknown): Narrowed[K] => {
  if (!isRecord(raw)) return null;
  switch (name) {
    case "ticket:message": {
      const message = narrowPostedMessage(raw);
      return (message ? { ...message, display_number: asString(raw.display_number) ?? undefined } : null) as Narrowed[K];
    }
    case "ticket:status_changed": {
      const ticket_id = ticketIdOf(name, raw);
      const from = asStatus(raw.from);
      const to = asStatus(raw.to);
      if (ticket_id === null || !from || !to) return null;
      return { ...raw, ticket_id, from, to, trigger: asString(raw.trigger) ?? undefined } as Narrowed[K];
    }
    case "ticket:assigned": {
      const ticket_id = ticketIdOf(name, raw);
      if (ticket_id === null) return null;
      const agentRaw = isRecord(raw.agent) ? raw.agent : isRecord(raw.assignee) ? raw.assignee : null;
      const agentId = agentRaw ? asInt(agentRaw.id) : null;
      const agent =
        agentRaw && agentId !== null
          ? {
              id: agentId,
              name: typeof agentRaw.name === "string" ? agentRaw.name : null,
              image: typeof agentRaw.image === "string" ? agentRaw.image : null,
            }
          : null;
      return { ...raw, ticket_id, agent } as Narrowed[K];
    }
    case "ticket:feedback": {
      const ticket_id = ticketIdOf(name, raw);
      const rating = asInt(raw.rating);
      if (ticket_id === null || rating === null) return null;
      return { ...raw, ticket_id, rating } as Narrowed[K];
    }
    case "ticket:updated": {
      const ticket_id = ticketIdOf(name, raw);
      if (ticket_id === null || !isRecord(raw.changes)) return null;
      return {
        ...raw,
        ticket_id,
        changes: narrowChanges(raw.changes),
        updated_at: asString(raw.updated_at) ?? new Date().toISOString(),
      } as Narrowed[K];
    }
    case "ticket:new": {
      const id = asInt(raw.id) ?? asInt(raw.ticket_id);
      const status = asStatus(raw.status);
      const priority = asPriority(raw.priority);
      if (id === null || !status || !priority || typeof raw.title !== "string") return null;
      return {
        ...raw,
        id,
        ticket_id: asInt(raw.ticket_id) ?? id,
        status,
        priority,
        created_at: typeof raw.created_at === "string" ? raw.created_at : new Date().toISOString(),
      } as Narrowed[K];
    }
    default:
      return null;
  }
};

/* ───────────────────────────── the hook ───────────────────────────── */

/*
 * The `/support` namespace (§9.1, backend step 5) is multiplexed on the
 * default socket's Manager (one transport). It is created lazily, shared by
 * every mounted consumer and disconnected when the last one unmounts. Its
 * auth is a function so it reads the token `SocketProvider` sets — the
 * provider's effect runs AFTER its children's effects on first load, so a
 * value captured at creation could still be undefined.
 */
let supportNamespaceSocket: Socket | null = null;
let supportNamespaceUsers = 0;

/*
 * Where the consumers take their events from (a tiny external store, read with
 * `useSyncExternalStore`). The default namespace keeps emitting the §8.7 copies
 * of every event, so it is the fallback whenever `/support` cannot be used:
 * - `support`: the `/support` namespace (the normal case).
 * - `deferred`: `/support` refused with `TOO_MANY_CONNECTIONS` and a retry is
 *   pending (≥ 30 s). The consumers listen on the default namespace meanwhile —
 *   without it the page showed Offline and missed every event for each backoff,
 *   for good while 20+ `/support` sockets of the user stayed open elsewhere
 *   (step-9c review). They keep their share of the `/support` socket so the
 *   retry stays armed, and move back on its next successful connect.
 * - `unavailable`: server-side rollback (backend `SUPPORT_SOCKET_NS=false`, or a
 *   realtime build older than step 5): the CONNECT is refused with "Invalid
 *   namespace" (seen live: `44/support,{"message":"Invalid namespace"}`). The
 *   flag here is build-time, so every consumer moves to the default namespace
 *   for the life of the page; a reload tries `/support` again. Final.
 */
type NamespaceMode = "support" | "deferred" | "unavailable";
let namespaceMode: NamespaceMode = "support";
const modeListeners = new Set<() => void>();
const setNamespaceMode = (mode: NamespaceMode) => {
  if (namespaceMode === mode || namespaceMode === "unavailable") return;
  namespaceMode = mode;
  modeListeners.forEach((listener) => listener());
};
const subscribeNamespaceMode = (listener: () => void) => {
  modeListeners.add(listener);
  return () => {
    modeListeners.delete(listener);
  };
};
const readNamespaceMode = () => namespaceMode;
const serverNamespaceMode = (): NamespaceMode => "support";

const markSupportNamespaceUnavailable = () => {
  if (namespaceMode === "unavailable") return;
  supportNamespaceSocket?.disconnect();
  setNamespaceMode("unavailable");
};

/*
 * Handshake refusals other than "Invalid namespace" (backend realtime/handshake.ts, step-5 report
 * §2.1). socket.io-client never retries a middleware refusal by itself — the namespace socket is
 * dead until `connect()` is called — so the retry policy lives here:
 * - `TOO_MANY_CONNECTIONS` (≥ 20 `/support` sockets of this user, e.g. many tabs): one retry after
 *   ≥ 30 s plus jitter, repeated while the refusal repeats.
 * - `Unauthorized` (expired / rotated token): a few slow retries; the auth callback re-reads the
 *   shared token, so a session the shell replaced meanwhile gets through. Then it stops — the
 *   page's next HTTP read answers 401 and sends the user to /session-expired.
 * - `ACCOUNT_*` (removed / deleted / parked / deactivated): no retry at all.
 * A successful connect resets the counters.
 */
let namespaceRetryTimer: ReturnType<typeof setTimeout> | null = null;
let unauthorizedAttempts = 0;

const clearNamespaceRetry = () => {
  if (namespaceRetryTimer) clearTimeout(namespaceRetryTimer);
  namespaceRetryTimer = null;
};

const retryNamespaceAfter = (ms: number) => {
  clearNamespaceRetry();
  namespaceRetryTimer = setTimeout(() => {
    namespaceRetryTimer = null;
    const socket = supportNamespaceSocket;
    if (socket && supportNamespaceUsers > 0 && !socket.connected && namespaceMode !== "unavailable") socket.connect();
  }, ms + Math.random() * 10_000);
};

const onNamespaceRefused = (error: Error) => {
  const reason = error?.message ?? "";
  if (reason === "Invalid namespace") {
    markSupportNamespaceUnavailable();
    return;
  }
  if (reason === "TOO_MANY_CONNECTIONS") {
    setNamespaceMode("deferred");
    retryNamespaceAfter(TOO_MANY_CONNECTIONS_BACKOFF_MS);
    return;
  }
  if (reason === "Unauthorized") {
    const wait = UNAUTHORIZED_RETRY_MS[unauthorizedAttempts];
    unauthorizedAttempts += 1;
    if (wait !== undefined) retryNamespaceAfter(wait);
    return;
  }
  // `ACCOUNT_*` and anything unknown from the middleware: stay disconnected (never a retry loop).
  // Transport errors ("xhr poll error", "websocket error", "timeout") keep the socket active and
  // ride the Manager's own reconnection.
};

/** `wanted` = the flag is on and this consumer has not fallen back to the default namespace for good. */
const acquireSupportNamespace = (wanted: boolean): Socket | null => {
  if (!wanted || namespaceMode === "unavailable") return null;
  if (!supportNamespaceSocket) {
    supportNamespaceSocket = defaultSocket.io.socket("/support", {
      // read at every (re)connect: the token SocketProvider sets, and who is asking (step-5 §9)
      auth: (cb: (data: object) => void) => {
        const auth = defaultSocket.auth;
        cb({ ...(typeof auth === "object" && auth !== null ? auth : {}), client_type: "dashboard" });
      },
    });
    supportNamespaceSocket.on("connect_error", onNamespaceRefused);
    supportNamespaceSocket.on("connect", () => {
      unauthorizedAttempts = 0;
      clearNamespaceRetry();
      setNamespaceMode("support");
    });
  }
  supportNamespaceUsers += 1;
  if (!supportNamespaceSocket.connected && !namespaceRetryTimer) supportNamespaceSocket.connect();
  return supportNamespaceSocket;
};

const releaseSupportNamespace = () => {
  if (!supportNamespaceSocket) return;
  supportNamespaceUsers = Math.max(0, supportNamespaceUsers - 1);
  if (supportNamespaceUsers === 0) {
    clearNamespaceRetry();
    supportNamespaceSocket.disconnect();
  }
};

export function useSupportSocket(options: UseSupportSocketOptions = {}): SupportSocketState {
  const {
    refetch,
    ticketId = null,
    dataAt = null,
    enabled = true,
    minRefetchDelayMs = 5000,
    refetchJitterMs = 2000,
  } = options;

  // Latest handlers / refetch / render time / ticket without re-subscribing: written after render
  // (never during it), read only from socket callbacks.
  const handlersRef = useLatestRef<SupportSocketHandlers>(options);
  const refetchRef = useLatestRef(refetch);
  const dataAtRef = useLatestRef(dataAt);
  const ticketIdRef = useLatestRef(ticketId);

  // see `NamespaceMode`: a refusal moves the subscription effect below to the default namespace
  const mode = useSyncExternalStore(subscribeNamespaceMode, readNamespaceMode, serverNamespaceMode);
  /** this consumer holds a share of the `/support` socket (also while deferred: the retry needs it) */
  const namespaceWanted = SUPPORT_NS_ENABLED && mode !== "unavailable";
  /** …and takes its events from it */
  const listenOnNamespace = namespaceWanted && mode === "support";

  const [connected, setConnected] = useState<boolean>(() =>
    SUPPORT_NS_ENABLED && namespaceMode === "support"
      ? Boolean(supportNamespaceSocket?.connected)
      : defaultSocket.connected,
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** the reason the armed timer will refetch with ("events" is overridden by any other) */
  const timerReasonRef = useRef<RefetchReason>("events");
  const lastRefetchAtRef = useRef(0);
  /** the socket (namespace or default) the subscription effect uses — read by `emitRead` */
  const sourceRef = useRef<{ socket: Socket; namespace: boolean } | null>(null);
  /** whether the subscription effect's ticket room is joined (typing is relayed to members only) */
  const joinedRef = useRef<() => boolean>(() => false);
  /** callbacks waiting for the next successful `join:ticket` (a read receipt sent right after load) */
  const joinWaitersRef = useRef(new Set<() => void>());

  const runRefetch = useCallback((reason: RefetchReason) => {
    // A hidden tab never refetches: the events were already applied in place,
    // and `visibilitychange → visible` refetches once on return. At scale this
    // keeps background tabs from multiplying every staff action (§18 table).
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    lastRefetchAtRef.current = Date.now();
    const result = refetchRef.current?.(reason);
    if (result && typeof (result as Promise<unknown>).catch === "function") {
      (result as Promise<unknown>).catch(() => undefined);
    }
  }, [refetchRef]);

  const arm = useCallback(
    (delay: number, reason: RefetchReason) => {
      timerReasonRef.current = reason;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        runRefetch(timerReasonRef.current);
      }, delay);
    },
    [runRefetch],
  );

  /**
   * Event-driven refetch = a ≥ 5 s jittered debounce per page (blueprint §18
   * "event-driven refetch amplification", §19.3): the FIRST event of a burst
   * arms one timer `floor + jitter` after itself and every later event rides
   * on it, so a burst collapses into one request that lands ≥ 5 s after the
   * first event, and a staff bulk action does not make every open tab hit
   * the API in the same second. The timer is never pushed back, so a
   * continuous stream still converges every ~5–7 s.
   *
   * `prompt` (reconnect, tab visible again, first connect) refetches after a
   * random 0…jitter delay when the last refetch is at least `floor` old (so a
   * realtime restart does not make every open tab read in the same second),
   * else once the floor has passed. It replaces a pending event timer, whose
   * events the prompt read covers.
   */
  const scheduleRefetch = useCallback(
    (reason: RefetchReason = "events") => {
      if (!refetchRef.current) return;
      const floor = Math.max(1000, minRefetchDelayMs);
      const jitter = Math.random() * Math.max(0, refetchJitterMs);
      if (reason !== "events") {
        const elapsed = Date.now() - lastRefetchAtRef.current;
        const wait = elapsed >= floor ? jitter : floor - elapsed;
        if (timerRef.current) {
          // an armed prompt timer stays; an armed event timer is promoted (it may land later)
          if (timerReasonRef.current !== "events") return;
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        arm(wait, reason);
        return;
      }
      if (timerRef.current) return;
      arm(floor + jitter, "events");
    },
    [arm, minRefetchDelayMs, refetchJitterMs, refetchRef],
  );

  // This consumer's share of the `/support` socket — its own effect, so a switch of the listening
  // namespace (deferred ⇄ support) never drops the last share and disconnects the socket mid-switch.
  useEffect(() => {
    if (!enabled) return;
    const held = acquireSupportNamespace(namespaceWanted);
    return () => {
      if (held) releaseSupportNamespace();
    };
  }, [enabled, namespaceWanted]);

  useEffect(() => {
    if (!enabled) return;

    // One source of ticket events: the /support namespace when it is on
    // (step 5 emits the §9.3 shapes there), else the default namespace.
    // Never both — the same change would be applied twice.
    const nsSocket = listenOnNamespace ? supportNamespaceSocket : null;
    const source: Socket = nsSocket ?? defaultSocket;
    const onTicket = ticketId !== null && ticketId !== undefined;
    sourceRef.current = { socket: source, namespace: nsSocket !== null };

    /* presence (§9.3, `/support` only): every 20 s while this ticket page is visible and joined */
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let joined = false;
    const beat = () => {
      if (source.connected && joined) source.emit("presence:heartbeat", { id: ticketId });
    };
    const stopHeartbeat = () => {
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = null;
    };
    const startHeartbeat = () => {
      if (!nsSocket || !onTicket || !joined || heartbeat) return;
      if (document.visibilityState !== "visible") return;
      beat();
      heartbeat = setInterval(beat, PRESENCE_HEARTBEAT_MS);
    };

    /*
     * `join:ticket` with its ack (step-5 §2.3). `rate_limited` is retried after 2 s and
     * `server_error` with a short backoff; `not_found` (no access — the API's 404 rule) and
     * `invalid_ticket_id` are final. The default namespace's join acks `{ ok }` or nothing.
     */
    let joinRetry: ReturnType<typeof setTimeout> | null = null;
    let joinServerErrors = 0;
    let disposed = false;
    const clearJoinRetry = () => {
      if (joinRetry) clearTimeout(joinRetry);
      joinRetry = null;
    };
    const joinRoom = () => {
      clearJoinRetry();
      if (!onTicket || !source.connected) return;
      source.emit("join:ticket", { ticket_id: ticketId }, (ack?: JoinAck) => {
        if (disposed) return;
        if (ack && ack.ok === false) {
          const wait =
            ack.error === "rate_limited"
              ? JOIN_RATE_LIMITED_RETRY_MS
              : ack.error === "server_error"
                ? JOIN_SERVER_ERROR_RETRY_MS[joinServerErrors++]
                : undefined;
          if (wait !== undefined) joinRetry = setTimeout(joinRoom, wait);
          else if (process.env.NODE_ENV !== "production") {
            console.warn(`[support] join:ticket ${ticketId} refused:`, ack.error);
          }
          return;
        }
        joined = true;
        joinServerErrors = 0;
        startHeartbeat();
        const waiters = [...joinWaitersRef.current];
        joinWaitersRef.current.clear();
        waiters.forEach((wake) => wake());
      });
    };

    /** events seen while the tab was hidden (they were applied; the return refetch converges them) */
    let eventWhileHidden = false;
    let hiddenAt: number | null = document.visibilityState === "hidden" ? Date.now() : null;

    const dispatch = (name: SupportSocketEventName, raw: unknown) => {
      const event = narrowEvent(name, raw);
      if (!event) return;
      if (onTicket) {
        const eventTicket = ticketIdOf(name, event as unknown as Record<string, unknown>);
        if (eventTicket !== null && eventTicket !== ticketId) return;
      }
      if (document.visibilityState === "hidden") eventWhileHidden = true;
      const handlers = handlersRef.current;
      let handled: Handled;
      switch (name) {
        case "ticket:new":
          handled = handlers.onNew?.(event as TicketNewEvent);
          break;
        case "ticket:message":
          handled = handlers.onMessage?.(event as TicketMessageEvent);
          break;
        case "ticket:status_changed":
          handled = handlers.onStatusChanged?.(event as TicketStatusChangedEvent);
          break;
        case "ticket:assigned":
          handled = handlers.onAssigned?.(event as TicketAssignedEvent);
          break;
        case "ticket:feedback":
          handled = handlers.onFeedback?.(event as TicketFeedbackEvent);
          break;
        case "ticket:updated":
          handled = handlers.onUpdated?.(event as TicketUpdatedEvent);
          break;
      }
      if (handled !== false) scheduleRefetch("events");
    };

    const listeners = SUPPORT_SOCKET_EVENTS.map((name) => ({
      name,
      fn: (raw: unknown) => dispatch(name, raw),
    }));

    // The first connect of this subscription: the server render may predate it (hard load: the
    // socket connects after hydration, SocketProvider's effect runs after the page's).
    let firstConnect = !source.connected;
    const handleConnect = () => {
      setConnected(true);
      joined = false;
      joinRoom();
      if (firstConnect) {
        firstConnect = false;
        const at = dataAtRef.current;
        const age = at ? Date.now() - at : Number.POSITIVE_INFINITY;
        if (age > STALE_AT_CONNECT_MS || age < -60_000) scheduleRefetch("connect");
      }
    };
    const handleDisconnect = () => {
      setConnected(false);
      joined = false;
      clearJoinRetry();
      stopHeartbeat();
    };
    const handleReconnect = () => {
      handlersRef.current.onReconnect?.();
      scheduleRefetch("reconnect");
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        eventWhileHidden = false;
        stopHeartbeat();
        return;
      }
      const away = hiddenAt === null ? 0 : Date.now() - hiddenAt;
      hiddenAt = null;
      startHeartbeat();
      // Back on the tab: re-read only when something may have been missed or applied unconverged.
      if (eventWhileHidden || away >= Math.max(1000, minRefetchDelayMs)) scheduleRefetch("visible");
      eventWhileHidden = false;
    };

    listeners.forEach(({ name, fn }) => source.on(name, fn));
    source.on("connect", handleConnect);
    source.on("disconnect", handleDisconnect);
    // The Manager is shared by both namespaces: one transport reconnect.
    defaultSocket.io.on("reconnect", handleReconnect);
    document.addEventListener("visibilitychange", handleVisibility);

    setConnected(source.connected);
    joinRoom();
    joinedRef.current = () => joined;
    // Moved to the default namespace by a refusal: `/support` never connected, so events between the
    // server render and now may be missing — the catch-up the first connect would have done.
    if (mode === "deferred" && source.connected) {
      const at = dataAtRef.current;
      const age = at ? Date.now() - at : Number.POSITIVE_INFINITY;
      if (age > STALE_AT_CONNECT_MS || age < -60_000) scheduleRefetch("connect");
    }

    return () => {
      disposed = true;
      clearJoinRetry();
      joinedRef.current = () => false;
      listeners.forEach(({ name, fn }) => source.off(name, fn));
      source.off("connect", handleConnect);
      source.off("disconnect", handleDisconnect);
      defaultSocket.io.off("reconnect", handleReconnect);
      document.removeEventListener("visibilitychange", handleVisibility);
      stopHeartbeat();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (onTicket && source.connected) {
        source.emit("leave:ticket", { ticket_id: ticketId });
      }
      if (sourceRef.current?.socket === source) sourceRef.current = null;
    };
  }, [enabled, ticketId, scheduleRefetch, listenOnNamespace, mode, minRefetchDelayMs, dataAtRef, handlersRef]);

  /*
   * `ticket:read` needs the joined room. The usual first read — a ticket opened with an unread reply
   * on screen — is ready before the socket has connected (it connects after hydration), so the read
   * waits up to the ack timeout for the join instead of going straight to HTTP (step 9c: every such
   * open had posted the HTTP read mark).
   */
  const whenJoined = useCallback(
    (ms: number) =>
      new Promise<boolean>((resolve) => {
        const current = sourceRef.current;
        if (current?.socket.connected && joinedRef.current()) {
          resolve(true);
          return;
        }
        const wake = () => {
          clearTimeout(timer);
          resolve(true);
        };
        const timer = setTimeout(() => {
          joinWaitersRef.current.delete(wake);
          resolve(false);
        }, ms);
        joinWaitersRef.current.add(wake);
      }),
    [],
  );

  const emitRead = useCallback(async (lastReadMessageId: number): Promise<boolean> => {
    const id = ticketIdRef.current;
    if (!sourceRef.current?.namespace || id === null || id === undefined) return false;
    if (!(await whenJoined(READ_ACK_TIMEOUT_MS))) return false;
    const current = sourceRef.current;
    if (!current?.namespace || !current.socket.connected || ticketIdRef.current !== id) return false;
    return new Promise<boolean>((resolve) => {
      current.socket
        .timeout(READ_ACK_TIMEOUT_MS)
        .emit("ticket:read", { id, last_read_message_id: lastReadMessageId }, (error: Error | null, ack?: JoinAck) => {
          resolve(!error && ack?.ok === true);
        });
    });
  }, [ticketIdRef, whenJoined]);

  const emitTyping = useCallback((isTyping: boolean) => {
    const current = sourceRef.current;
    const id = ticketIdRef.current;
    if (!current?.namespace || !current.socket.connected || id === null || id === undefined) return;
    if (!joinedRef.current()) return;
    current.socket.emit("ticket:typing", { id, is_typing: isTyping });
  }, [ticketIdRef]);

  return { connected, supportNamespace: listenOnNamespace, emitRead, emitTyping };
}

export default useSupportSocket;
