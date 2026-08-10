// utils.ts

import { formatDistanceToNowStrict } from "date-fns";
import { IntegrationImportResult } from "@/types/type";

/**
 * Formats an ISO date into a relative string.
 *
 * Example:
 * "2026-08-01T10:00:00Z" -> "5 days ago"
 */
export const formatRelative = (iso?: string | null): string => {
    if (!iso) return "—";

    try {
        return `${formatDistanceToNowStrict(new Date(iso))} ago`;
    } catch {
        return "—";
    }
};

/**
 * Merges two sync/import results.
 *
 * - imported: concatenated
 * - skipped: concatenated
 * - unmatched_users: unique by id
 * - remaining_ids: latest response wins
 */
export const mergeResults = (
    previous: IntegrationImportResult,
    current: IntegrationImportResult,
): IntegrationImportResult => ({
    imported: [
        ...(previous.imported ?? []),
        ...(current.imported ?? []),
    ],

    skipped: [
        ...(previous.skipped ?? []),
        ...(current.skipped ?? []),
    ],

    unmatched_users: [
        ...(previous.unmatched_users ?? []),
        ...(current.unmatched_users ?? []),
    ].filter(
        (user, index, array) =>
            array.findIndex((u) => u.id === user.id) === index,
    ),

    remaining_ids: current.remaining_ids,
});

/**
 * Returns true if both arrays contain the same ids.
 */
export const sameIds = (
    first: string[],
    second: string[],
): boolean =>
    first.length === second.length &&
    first.every((id) => second.includes(id));