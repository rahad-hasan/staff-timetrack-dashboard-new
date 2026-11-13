import { buildQuery, type QueryParams } from "@/utils/buildQuery";
import type { IResponse } from "@/types/type";

/**
 * Reads one of the GET route handlers built on `liveJson`
 * (src/lib/server/liveJson.ts) from the browser: how client components read
 * live data, never through server actions. Next runs a tab's server actions
 * one at a time, so a read sent as one waits behind the user's saves, and one
 * that settles while the page hydrates sends the router through an extra
 * update in the middle of it.
 *
 * Resolves with the API envelope the route relays when it answered 2xx, and
 * with null otherwise: aborted through `signal`, offline, or a failure status.
 * A 401 is one of them — the session is gone, and the next server render or
 * save lands on /session-expired, as for HeaderWorkTime's poll.
 */
export async function readLiveJson<T>(
  path: string,
  { query, signal }: { query?: QueryParams; signal?: AbortSignal } = {},
): Promise<IResponse<T> | null> {
  const qs = query ? buildQuery(query) : "";
  try {
    const response = await fetch(qs ? `${path}?${qs}` : path, {
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
    return response.ok ? ((await response.json()) as IResponse<T>) : null;
  } catch {
    return null;
  }
}
