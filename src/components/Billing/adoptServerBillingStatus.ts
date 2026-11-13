import { isOvertakenByHeld, useBillingStore } from "@/store/billingStore";
import type { IBillingStatus } from "@/types/billing";

/**
 * The longest a page render can have been on its way to this tab — from its
 * server stamp to the commit that hands it over — and still lose a race to a
 * status the store got meanwhile. A snapshot cannot tell when its request
 * left, so it is taken to have left this long before it landed: the most a
 * status stamped by a clock running ahead can hold a page's back (see
 * `isOvertakenByHeld`).
 */
const MAX_SNAPSHOT_FLIGHT_MS = 30_000;

/** Handed snapshots this tab remembers; a Back/Forward restore replays one. */
const REMEMBERED_SNAPSHOTS = 200;

/**
 * How long after a snapshot was first handed a second hand-over of it is not
 * a restore: one commit handing it twice (Strict Mode's second effect pass;
 * the layout's and the page's stamps falling in the same millisecond), or a
 * Back within seconds of the visit, when it is as fresh as a poll keeps it.
 */
const REPLAY_FRESH_MS = 5_000;

/**
 * Stamps of the server-rendered snapshots this tab has been handed, adopted
 * or not — identities, never compared as times — each with this tab's
 * `performance.now()` when it was first handed. Browser-only state: the
 * function below never writes on the server (effects do not run there), and
 * it must not — the module-level map would be shared by every request and
 * every tenant.
 */
const handedSnapshots = new Map<number, number>();

/**
 * Hands a server-rendered `billing/status` snapshot to the billing store.
 *
 * A page that reads the status during its own render holds the freshest
 * snapshot there is, while the store may still carry whatever an earlier page
 * of this tab fetched — the pre-purchase trial right after checkout, the old
 * seat count after another admin bought seats. So the page's copy wins.
 *
 * Except when it is not new: Back/Forward restores a page from Next's router
 * cache with the props it was first rendered with, and adopting those would
 * roll the store back to a snapshot it has long moved past. `fetchedAt`, the
 * server's `Date.now()` taken next to the read, marks a restored snapshot as
 * one this tab was already handed, and it is ignored. Nor is a snapshot
 * adopted over a status the store read after it (`isOvertakenByHeld`): a poll
 * or a forced read that left after this page's read but landed before the
 * page did.
 *
 * Returns what became of the snapshot: `"adopted"` (the store was updated),
 * `"replayed"` (one this tab was handed more than `REPLAY_FRESH_MS` ago: a
 * restored page, whose status is as old as its first visit, so the surface
 * mounting on it reads the status itself), or `"ignored"` (no usable
 * snapshot, one handed again while still fresh, or the store holds a newer
 * status).
 */
export function adoptServerBillingStatus(
  status: IBillingStatus | null | undefined,
  fetchedAt: number,
): "adopted" | "replayed" | "ignored" {
  if (typeof window === "undefined") return "ignored";
  if (!status || !Number.isFinite(fetchedAt) || fetchedAt <= 0) {
    return "ignored";
  }
  const landedAt = performance.now();
  const firstHandedAt = handedSnapshots.get(fetchedAt);
  if (firstHandedAt !== undefined) {
    return landedAt - firstHandedAt > REPLAY_FRESH_MS ? "replayed" : "ignored";
  }
  handedSnapshots.set(fetchedAt, landedAt);
  if (handedSnapshots.size > REMEMBERED_SNAPSHOTS) {
    handedSnapshots.delete(handedSnapshots.keys().next().value as number);
  }

  if (isOvertakenByHeld(fetchedAt, landedAt - MAX_SNAPSHOT_FLIGHT_MS, true)) {
    return "ignored";
  }
  useBillingStore.setState({
    status,
    statusFetchedAt: fetchedAt,
    statusLandedAt: landedAt,
    loaded: true,
  });
  return "adopted";
}
