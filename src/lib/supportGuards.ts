/**
 * Runtime guards for support payloads (socket events, audit `changes`, the
 * relay's envelopes). One definition each, so every boundary narrows the
 * same way.
 */

import type { TicketPriority, TicketStatus } from "@/types/support";
import { TICKET_PRIORITY_VALUES, TICKET_STATUS_VALUES } from "@/types/support";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const asInt = (value: unknown): number | null =>
  typeof value === "number" && Number.isSafeInteger(value) ? value : null;

export const isStatus = (value: unknown): value is TicketStatus =>
  typeof value === "string" && (TICKET_STATUS_VALUES as string[]).includes(value);

export const asStatus = (value: unknown): TicketStatus | null => (isStatus(value) ? value : null);

export const isPriority = (value: unknown): value is TicketPriority =>
  typeof value === "string" && (TICKET_PRIORITY_VALUES as string[]).includes(value);

export const asPriority = (value: unknown): TicketPriority | null => (isPriority(value) ? value : null);

/** Epoch ms of an API timestamp; 0 for a missing or unparsable one (sorts first, never NaN). */
export const toMs = (value: string | null | undefined): number => {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};
