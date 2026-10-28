/**
 * How the ticket page folds server reads, the reply's ticket patch and live
 * events into the ticket it holds (pure — no React). Row-level `ticket:updated`
 * handling is shared with the list (`applyTicketUpdate` in list/listState.ts).
 */

import type {
  SocketActor,
  TicketPatch,
  TicketRequesterDetail,
  TicketStatus,
  TimelineEvent,
  UserRef,
} from "@/types/support";
import { toMs } from "@/lib/supportGuards";

/** The fields live events change in place — a refetch that started before them must not roll them back. */
const LIVE_FIELDS = [
  "status",
  "needs_requester_reply",
  "can_reply",
  "can_rate",
  "expected_reply_by",
  "agent",
  "priority",
  "title",
  "category",
  "category_id",
  "category_ref",
  "updated_at",
  "reopen_count",
] as const satisfies readonly (keyof TicketRequesterDetail)[];

/** A full read (`GET /tickets/:id`): the fresher of the two wins; an older read keeps the live fields. */
export const mergeFresh = (prev: TicketRequesterDetail, fresh: TicketRequesterDetail): TicketRequesterDetail => {
  if (toMs(fresh.updated_at) >= toMs(prev.updated_at)) return fresh;
  const kept: Partial<TicketRequesterDetail> = {};
  for (const key of LIVE_FIELDS) {
    (kept as Record<string, unknown>)[key] = prev[key];
  }
  return {
    ...fresh,
    ...kept,
    public_message_count: Math.max(prev.public_message_count, fresh.public_message_count),
  };
};

/** `ticket:status_changed` applied in place (the refetch re-reads what it cannot know, e.g. a new reply target). */
export const applyStatus = (
  prev: TicketRequesterDetail,
  to: TicketStatus,
  at: string,
  reopenCount?: number,
): TicketRequesterDetail => {
  const leavingResolved = (prev.status === "resolved" || prev.status === "closed") && to !== "resolved" && to !== "closed";
  return {
    ...prev,
    status: to,
    needs_requester_reply: to === "pending_customer",
    can_reply: to !== "closed",
    can_rate: prev.feedback_enabled && (to === "resolved" || to === "closed") && prev.feedback === null,
    // paused / stopped clocks have no target; a running one is re-read by the refetch
    expected_reply_by: to === "open" || to === "in_progress" ? prev.expected_reply_by : null,
    reopen_count: reopenCount ?? (leavingResolved ? prev.reopen_count + 1 : prev.reopen_count),
    resolved_at: to === "resolved" ? at : prev.resolved_at,
    closed_at: to === "closed" ? at : prev.closed_at,
    updated_at: toMs(at) > toMs(prev.updated_at) ? at : prev.updated_at,
  };
};

/**
 * The keys of a reply's ticket patch the page takes over. The patch never carries the heavy or
 * thread fields (timeline, thread, files, description, feedback), and those are not listed here.
 */
const PATCH_KEYS = [
  "status",
  "updated_at",
  "display_number",
  "ticket_number",
  "title",
  "priority",
  "category",
  "category_id",
  "category_ref",
  "agent",
  "created_at",
  "public_message_count",
  "rating",
  "last_message_at",
  "needs_requester_reply",
  "expected_reply_by",
  "first_response_at",
  "resolved_at",
  "closed_at",
  "closed_reason",
  "reopened_from_id",
  "reopen_count",
  "can_reply",
  "can_rate",
  "feedback_enabled",
  "rate_later_enabled",
] as const satisfies readonly (keyof TicketPatch & keyof TicketRequesterDetail)[];

type PatchKey = (typeof PATCH_KEYS)[number];

/** The listed keys the patch actually carries (an absent or invalid one was narrowed to undefined). */
const pickDefined = (patch: TicketPatch): Partial<Pick<TicketRequesterDetail, PatchKey>> => {
  const out: Partial<Record<PatchKey, unknown>> = {};
  for (const key of PATCH_KEYS) {
    if (patch[key] !== undefined) out[key] = patch[key];
  }
  return out as Partial<Pick<TicketRequesterDetail, PatchKey>>;
};

/** A reply's ticket patch over the ticket the page holds (the caller has checked it is not older). */
export const applyPatch = (prev: TicketRequesterDetail, patch: TicketPatch): TicketRequesterDetail => ({
  ...prev,
  ...pickDefined(patch),
});

/**
 * Socket actors arrive as `'system'`, a bare user id (status changes) or
 * `{ id, name, image }`. A bare id is named from what the page knows (the
 * assignee, the requester); an unknown one stays unnamed — the copy then
 * uses a neutral sentence instead of guessing.
 */
export const actorRef = (actor: SocketActor | undefined, ticket: TicketRequesterDetail): TimelineEvent["actor"] => {
  if (actor && typeof actor === "object" && typeof actor.id === "number") {
    return { id: actor.id, name: actor.name ?? "", image: actor.image ?? null, exists: true };
  }
  if (typeof actor === "number") {
    const agent: UserRef | null = ticket.agent;
    if (agent && agent.id === actor) return { id: actor, name: agent.name, image: agent.image, exists: true };
    if (ticket.requester_id === actor) return { id: actor, name: ticket.requester_name ?? "", image: null, exists: true };
    return { id: actor, name: "", image: null, exists: true };
  }
  return "system";
};

let syntheticId = 0;

/**
 * A timeline line synthesised from a socket event until the next read brings the server's own.
 * Negative ids never collide with server ids and give every line a unique key (threadState).
 */
export const localEvent = (
  action: string,
  changes: unknown,
  at: string,
  actor: TimelineEvent["actor"],
): TimelineEvent => {
  syntheticId -= 1;
  return { id: syntheticId, action, actor, changes, at, visibility: "public" };
};
