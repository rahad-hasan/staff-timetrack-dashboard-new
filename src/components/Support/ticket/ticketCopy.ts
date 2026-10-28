/**
 * Requester-side wording for the ticket page (blueprint §4.1 labels, §5.5
 * "requester-visible consequences", plan.md §3.3 event lines). Pure
 * functions so the timeline, the banners and the tests agree on one text.
 *
 * Audit `changes` shapes as built (backend core/ticket-state.ts,
 * services/ticket-core.service.ts):
 * - STATUS_CHANGED / TICKET_REOPENED `{ from, to, trigger, closed_reason?, previous? }`
 * - TICKET_ASSIGNED `{ from, to: agent id, reason }`
 * - TICKET_UPDATED  `{ priority?: {from,to}, category?: {from,to}, category_id?: {from,to}, title?: {from,to} }`
 * - FEEDBACK_SUBMITTED `{ rating, highlights, has_comment, rated_agent_id }`
 * - TICKET_CREATED  `{ status, priority, category, category_id }`
 */

import type { TicketSource, TicketStatus, TimelineEvent, UserRef } from "@/types/support";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/types/support";
import { asInt, asPriority, asStatus, isRecord } from "@/lib/supportGuards";

export const SOURCE_PHRASE: Record<TicketSource, string> = {
  web_form: "via the web form",
  desktop_app: "from the desktop app",
  email: "by email",
  api: "through the API",
};

export const SOURCE_LABEL: Record<TicketSource, string> = {
  web_form: "Web form",
  desktop_app: "Desktop app",
  email: "Email",
  api: "API",
};

/** One run of an event line: plain text, or an emphasised name / status label. */
export type EventSegment =
  | { kind: "text"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "status"; text: string; status: TicketStatus }
  | { kind: "stars"; rating: number };

export type EventTone = "created" | "assigned" | "status" | "reopened" | "rated" | "updated";

/** The tones drawn with a fixed glyph and tint (a `status` line takes the status's own). */
export type FixedEventTone = Exclude<EventTone, "status">;

/** One line of the rail: a status line always names its status (glyph + pill colours). */
export type EventLineCopy =
  | { tone: "status"; status: TicketStatus; segments: EventSegment[] }
  | { tone: FixedEventTone; status?: TicketStatus; segments: EventSegment[] };

export interface EventContext {
  /** the requester (the viewer) — events they caused read "You …" */
  requesterId: number | null;
  /** the current assignee, used to name the agent of an assignment line */
  agent: Pick<UserRef, "id" | "name"> | null;
  /** current category name for a TICKET_UPDATED category change */
  categoryName?: (slug: string) => string;
}

const actorOf = (event: TimelineEvent) => (event.actor === "system" ? null : event.actor);

const line = (tone: FixedEventTone, segments: EventSegment[], status?: TicketStatus): EventLineCopy => ({
  tone,
  status,
  segments,
});

const statusLine = (status: TicketStatus, segments: EventSegment[]): EventLineCopy => ({
  tone: "status",
  status,
  segments,
});

const categoryLabel = (slug: unknown, ctx: EventContext): string | null => {
  if (typeof slug !== "string" || !slug) return null;
  return ctx.categoryName?.(slug) ?? CATEGORY_LABELS[slug] ?? slug;
};

/**
 * The sentence for a public audit event, or null for one the requester
 * timeline does not show (unknown actions, TICKET_CREATED — the page draws
 * the opening line itself from the ticket row).
 */
export function describeEvent(event: TimelineEvent, ctx: EventContext): EventLineCopy | null {
  const actor = actorOf(event);
  const byMe = actor !== null && ctx.requesterId !== null && actor.id === ctx.requesterId;
  const actorName = actor?.name?.trim() || null;
  const changes = isRecord(event.changes) ? event.changes : {};

  switch (event.action) {
    case "TICKET_CREATED":
      return null;

    case "TICKET_ASSIGNED": {
      const to = asInt(changes.to);
      let name: string | null = null;
      if (to !== null && ctx.agent && ctx.agent.id === to) name = ctx.agent.name?.trim() || null;
      if (!name && to !== null && actor && actor.id === to) name = actorName;
      return line("assigned", [
        { kind: "strong", text: name ?? "A support agent" },
        { kind: "text", text: " joined the conversation" },
      ]);
    }

    case "STATUS_CHANGED":
    case "TICKET_REOPENED": {
      const to = asStatus(changes.to);
      if (!to) return null;
      const label = STATUS_LABELS[to];
      if (event.action === "TICKET_REOPENED") {
        const who: EventSegment[] = byMe
          ? [{ kind: "text", text: "You reopened this ticket" }]
          : actorName
            ? [{ kind: "strong", text: actorName }, { kind: "text", text: " reopened this ticket" }]
            : [{ kind: "text", text: "This ticket was reopened" }];
        return line(
          "reopened",
          [...who, { kind: "text", text: " · " }, { kind: "status", text: label, status: to }],
          to,
        );
      }
      if (to === "resolved" && actorName && !byMe) {
        return statusLine(to, [
          { kind: "strong", text: actorName },
          { kind: "text", text: " marked this ticket as " },
          { kind: "status", text: label, status: to },
        ]);
      }
      if (to === "closed") {
        if (changes.closed_reason === "auto_close" || changes.trigger === "auto_close") {
          return statusLine(to, [
            { kind: "text", text: "This ticket was " },
            { kind: "status", text: "closed", status: to },
            { kind: "text", text: " automatically" },
          ]);
        }
        if (actorName && !byMe) {
          return statusLine(to, [
            { kind: "strong", text: actorName },
            { kind: "text", text: " " },
            { kind: "status", text: "closed", status: to },
            { kind: "text", text: " this ticket" },
          ]);
        }
        return statusLine(to, [{ kind: "text", text: "This ticket was " }, { kind: "status", text: "closed", status: to }]);
      }
      return statusLine(to, [{ kind: "text", text: "Status changed to " }, { kind: "status", text: label, status: to }]);
    }

    case "FEEDBACK_SUBMITTED": {
      const rating = asInt(changes.rating);
      if (rating === null || rating < 1 || rating > 5) {
        return line("rated", [{ kind: "text", text: byMe ? "You rated this ticket" : "This ticket was rated" }]);
      }
      return line("rated", [
        // TD-06 vocabulary: "{requester} rated the agent ★★★★★" — the viewer is the requester
        { kind: "text", text: byMe || actor === null ? "You rated the agent " : "This ticket was rated " },
        { kind: "stars", rating },
      ]);
    }

    case "TICKET_UPDATED": {
      const parts: EventSegment[][] = [];
      const priority = isRecord(changes.priority) ? asPriority(changes.priority.to) : null;
      if (priority) {
        parts.push([{ kind: "text", text: "priority to " }, { kind: "strong", text: PRIORITY_LABELS[priority] }]);
      }
      const categoryTo = isRecord(changes.category) ? categoryLabel(changes.category.to, ctx) : null;
      if (categoryTo) {
        parts.push([{ kind: "text", text: "category to " }, { kind: "strong", text: categoryTo }]);
      }
      if (isRecord(changes.title) && typeof changes.title.to === "string") {
        parts.push([{ kind: "text", text: "the title" }]);
      }
      const who: EventSegment[] = actorName
        ? [{ kind: "strong", text: actorName }, { kind: "text", text: " updated " }]
        : [{ kind: "text", text: "Our team updated " }];
      if (parts.length === 0) {
        return line("updated", actorName ? [...who.slice(0, 1), { kind: "text", text: " updated the ticket details" }] : [{ kind: "text", text: "Ticket details updated" }]);
      }
      const joined: EventSegment[] = [];
      parts.forEach((part, index) => {
        if (index > 0) joined.push({ kind: "text", text: index === parts.length - 1 ? " and " : ", " });
        joined.push(...part);
      });
      return line("updated", [...who, ...joined]);
    }

    default:
      return null;
  }
}

/** "4 messages" — the description counts as the first message (§5.2 last paragraph). */
export const messagesLabel = (publicMessageCount: number) => {
  const total = Math.max(0, publicMessageCount) + 1;
  return `${total} ${total === 1 ? "message" : "messages"}`;
};

/** A first name for "{agent} asked …" style copy ("Priya Sharma" → "Priya"). */
export const firstName = (name: string | null | undefined) => {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? trimmed;
};

/**
 * What a screen reader hears when the status changes live (WCAG 4.1.3; §5.5 — the pill and the
 * banner change silently otherwise). Same sentences as the state banner where there is one.
 */
export const statusAnnouncement = (status: TicketStatus, agentFirstName: string | null): string => {
  const label = STATUS_LABELS[status] ?? status;
  switch (status) {
    case "pending_customer":
      return `Status changed to ${label} — ${agentFirstName ?? "our team"} needs a bit more information. Reply below and your ticket goes straight back to the team.`;
    case "in_progress":
      return `Status changed to ${label} — ${agentFirstName ?? "the support team"} is working on it.`;
    case "resolved":
      return `Status changed to ${label} — if something's still not right, reply below and the team will pick it back up.`;
    case "closed":
      return `Status changed to ${label} — this ticket can no longer be replied to. Open a new ticket if the issue returns.`;
    default:
      return `Status changed to ${label}.`;
  }
};
