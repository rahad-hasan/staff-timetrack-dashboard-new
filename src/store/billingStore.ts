import { create } from "zustand";
import { BILLING_STATUS_FETCHED_AT_HEADER } from "@/lib/billing";
import type { IBillingStatus } from "@/types/billing";
import type { IResponse } from "@/types/type";

/**
 * Client cache of `GET /packages/billing/status` — the billing state machine
 * that drives banners, takeovers and seat gating everywhere in the app.
 * Refresh after every billing action; poll (~5s) while a payment failure
 * banner is up or right after checkout, until the webhook flips the status.
 *
 * `addSeatsOpen` is global so any surface that hits the seat cap (e.g. the
 * add-member modal catching "Upgrade your plan to add more seats.") can open
 * the Add-seats dialog without mounting its own copy.
 */
interface BillingStore {
  status: IBillingStatus | null;
  /**
   * Server time (ms) taken just before the read behind `status`. This store's
   * own reads and the snapshots pages render (`adoptServerBillingStatus`) are
   * both stamped by a Next server's clock, and neither may replace a status
   * read after its own: they land in network order, not read order (see
   * `isOvertakenByHeld`). 0 while nothing is held.
   */
  statusFetchedAt: number;
  /** This tab's `performance.now()` when the status stamped `statusFetchedAt` landed. */
  statusLandedAt: number;
  loaded: boolean;
  fetching: boolean;
  /** The single in-flight status request, shared by concurrent callers. */
  inFlight: Promise<IBillingStatus | null> | null;
  /**
   * Id of the newest issued request. A response whose id is no longer current
   * has been superseded and is discarded rather than written to `status`.
   */
  requestId: number;
  fetchStatus: (options?: { force?: boolean }) => Promise<IBillingStatus | null>;

  /**
   * Bumped after every successful billing mutation (see `useBillingRefresh`).
   *
   * Surfaces that fetch and hold their OWN billing-derived data — the invoice
   * history table — watch this and re-read. Neither `revalidateTag` nor
   * `router.refresh()` can reach them: their data lives in component state, not
   * in Next's cache and not in the server-rendered tree.
   */
  dataVersion: number;
  bumpDataVersion: () => void;

  /** The pending poll tick; null while nobody polls or the tab is hidden. */
  pollTimer: ReturnType<typeof setTimeout> | null;
  /**
   * The poll timer is SHARED and reference-counted: several surfaces (payment
   * banner, billing page, pending-payment dialogs) can hold a claim at once,
   * and the poll only stops when the last claim is released. Callers must
   * balance every startPolling with exactly one release (start in a mount
   * effect, release in its cleanup).
   *
   * The poll runs at the most demanding claim's interval. Each claim gets
   * that interval for its first minute on a visible tab, then backs off to 30s
   * (see `FAST_PHASE_MS`). Ticks are skipped while the tab is hidden, and one
   * read runs as soon as it is visible again.
   */
  pollCount: number;
  /**
   * Claims the shared poll. Returns the release for exactly this claim —
   * prefer it to `stopPolling()`, which cannot tell whose claim it ends.
   */
  startPolling: (intervalMs?: number) => () => void;
  /** Releases one claim; see `releaseAnyClaim` for which. */
  stopPolling: () => void;

  addSeatsOpen: boolean;
  openAddSeats: () => void;
  closeAddSeats: () => void;

  /**
   * Back to a signed-out store: every claim dropped, the in-flight read
   * cancelled, the status forgotten. Part of `resetClientSession`.
   */
  reset: () => void;
}

/** Served by `src/app/api/billing/status/route.ts`. */
const STATUS_URL = "/api/billing/status";

/**
 * How long a claim is polled at the interval it asked for. After that it
 * backs off to `SLOW_POLL_MS`: the payment-failure banner claims 5s for as long
 * as a company is past due — days of Stripe retries — on every open tab of
 * every member, and nobody watches a banner that closely for that long. A
 * claim made since (a pending-payment dialog the user is waiting on) gets its
 * own fast minute, and returning to the tab always reads at once.
 *
 * Only time on a visible tab counts toward that minute (see `hiddenSince`):
 * the pending-payment surfaces send the user to Stripe in another tab, and a
 * minute measured from the claim ran out there, where no tick runs. Back from
 * paying, the result then took up to 30s to show instead of 5.
 */
const FAST_PHASE_MS = 60_000;
const SLOW_POLL_MS = 30_000;
const DEFAULT_POLL_MS = 5_000;

/**
 * What this tab's own timing may be off by: browsers coarsen
 * `performance.now()` (Firefox's resistFingerprinting to 100 ms), and servers
 * stamp in whole milliseconds.
 */
const TIMER_SLACK_MS = 250;

/**
 * Whether the status this store holds was read after an answer stamped
 * `fetchedAt` whose request left this tab at `sentAt` (`performance.now()`),
 * so that answer must not replace it. `ties`: an equal stamp counts as older.
 *
 * Stamps come from the clock of whichever Next server answered, so they order
 * reads only as well as those clocks agree. Taken alone, one stamp from a
 * clock running ahead (another instance, a clock stepped back since) outranked
 * every honest answer until real time caught up with it, and the billing UI
 * stayed on the status it carried. So a stamp counts only as far as this tab
 * can check it on its own clock: an answer can have been read before the held
 * one only if it was already on its way when the held one landed, and by no
 * more than that head start. A request sent after the held answer landed read
 * after it, whatever the stamps say; a stamp gap wider than the head start is
 * two clocks disagreeing, and the answer that arrived last wins.
 */
export function isOvertakenByHeld(
  fetchedAt: number,
  sentAt: number,
  ties: boolean,
): boolean {
  const { statusFetchedAt, statusLandedAt } = useBillingStore.getState();
  const lead = statusFetchedAt - fetchedAt;
  if (lead < 0 || (lead === 0 && !ties)) return false;
  return statusLandedAt - sentAt + TIMER_SLACK_MS >= lead;
}

/* ------------------------------------------------------------------ *
 * poll engine — module state, so a tick never re-renders anything
 * ------------------------------------------------------------------ */

interface PollClaim {
  intervalMs: number;
  since: number;
}

const claims = new Map<number, PollClaim>();
let lastClaimId = 0;
let pollTimeout: ReturnType<typeof setTimeout> | null = null;
let pollDueAt = 0;
/**
 * When the tab was hidden, while it is and a claim is held; null otherwise.
 * On the return every claim's `since` moves forward by the time it spent
 * hidden, so that time never counts toward its fast minute.
 */
let hiddenSince: number | null = null;
/** Cancels the status read in flight when a forced read or a reset supersedes it. */
let statusRequest: AbortController | null = null;

const isHidden = () =>
  typeof document !== "undefined" && document.visibilityState === "hidden";

/**
 * The interval a claim asks for right now. While the tab is hidden its fast
 * minute stands still at the moment the tab was hidden.
 */
const claimInterval = (claim: PollClaim, now: number) =>
  (hiddenSince ?? now) - claim.since < FAST_PHASE_MS
    ? claim.intervalMs
    : Math.max(claim.intervalMs, SLOW_POLL_MS);

const effectiveInterval = (now: number) => {
  let interval = Infinity;
  claims.forEach((claim) => {
    interval = Math.min(interval, claimInterval(claim, now));
  });
  return interval;
};

const syncPollState = () =>
  useBillingStore.setState({ pollTimer: pollTimeout, pollCount: claims.size });

const clearPollTimeout = () => {
  if (pollTimeout) clearTimeout(pollTimeout);
  pollTimeout = null;
};

/**
 * Arms the next tick for the most demanding claim. A pending tick that comes
 * sooner is kept; a faster claim re-arms it at its own interval instead of
 * waiting out a slower one. Nothing is armed while the tab is hidden.
 */
function schedulePoll() {
  if (claims.size === 0 || isHidden()) {
    clearPollTimeout();
    syncPollState();
    return;
  }

  const now = Date.now();
  const dueAt = now + effectiveInterval(now);
  if (!pollTimeout || dueAt < pollDueAt) {
    clearPollTimeout();
    pollDueAt = dueAt;
    pollTimeout = setTimeout(pollTick, dueAt - now);
  }
  syncPollState();
}

function pollTick() {
  pollTimeout = null;
  if (claims.size > 0 && !isHidden()) {
    void useBillingStore.getState().fetchStatus();
  }
  schedulePoll();
}

function onVisibilityChange() {
  const now = Date.now();
  if (isHidden()) {
    hiddenSince ??= now;
  } else {
    if (hiddenSince !== null) {
      // A claim made while the tab was hidden starts its minute now.
      const hiddenAt = hiddenSince;
      claims.forEach((claim) => {
        claim.since += now - Math.max(claim.since, hiddenAt);
      });
      hiddenSince = null;
    }
    // Back on the tab — often from paying the invoice in another one. Read
    // now rather than at the next tick, then resume the cadence.
    void useBillingStore.getState().fetchStatus();
  }
  schedulePoll();
}

function addClaim(intervalMs: number): number {
  if (claims.size === 0 && typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange);
  }
  const id = ++lastClaimId;
  const now = Date.now();
  claims.set(id, { intervalMs, since: now });
  // The first claim of a tab that is already hidden: nothing was listening
  // when it was, so its hidden time is counted from here.
  if (isHidden()) hiddenSince ??= now;
  schedulePoll();
  return id;
}

function stopPollEngine() {
  claims.clear();
  clearPollTimeout();
  // Nothing listens for the return any more.
  hiddenSince = null;
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }
}

function releaseClaim(id: number) {
  if (!claims.delete(id)) return;
  if (claims.size === 0) stopPollEngine();
  syncPollState();
}

/**
 * `stopPolling()` cannot say whose claim it ends, so it drops the least
 * demanding one (the oldest on a tie). Whoever really left, every remaining
 * claimant is still polled at least as often as it asks — at worst a departed
 * fast claim lingers until its fast minute runs out.
 */
function releaseAnyClaim() {
  const now = Date.now();
  let pick: number | undefined;
  let pickInterval = -1;
  claims.forEach((claim, id) => {
    const interval = claimInterval(claim, now);
    if (interval > pickInterval) {
      pick = id;
      pickInterval = interval;
    }
  });
  if (pick !== undefined) releaseClaim(pick);
}

async function readStatus(signal: AbortSignal) {
  // When the request leaves, on this tab's clock (see isOvertakenByHeld).
  const sentAt = performance.now();
  const response = await fetch(STATUS_URL, {
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  const body = (await response
    .json()
    .catch(() => null)) as IResponse<IBillingStatus> | null;
  // The route always stamps its answer; one without a usable stamp is taken
  // unordered, as every answer was before there was one.
  const stamp = Number(response.headers.get(BILLING_STATUS_FETCHED_AT_HEADER));
  const fetchedAt = Number.isFinite(stamp) && stamp > 0 ? stamp : null;
  return { httpStatus: response.status, body, fetchedAt, sentAt };
}

export const useBillingStore = create<BillingStore>()((set, get) => ({
  status: null,
  statusFetchedAt: 0,
  statusLandedAt: 0,
  loaded: false,
  fetching: false,
  inFlight: null,
  requestId: 0,

  dataVersion: 0,
  bumpDataVersion: () => set({ dataVersion: get().dataVersion + 1 }),

  /**
   * Concurrent callers SHARE the in-flight request instead of receiving the
   * current (pre-action) snapshot: flows like "Switch to Free" use
   * `await fetchStatus()` as their entire completion handoff, so returning a
   * stale snapshot — because a mount refresh or poll tick happened to be in
   * flight — would leave the blocked takeover mounted after the action
   * actually succeeded.
   *
   * `force: true` opts OUT of that sharing, and every read-after-write must use
   * it. Joining an in-flight request is only safe when the request was issued
   * after the write: a poll tick that left the browser a moment BEFORE the
   * charge answers with the pre-purchase snapshot, which is indistinguishable
   * from "the mutation did nothing" — the seat count silently stays put and the
   * user reloads the page to see what they just paid for. A forced request also
   * supersedes — and cancels — whatever was in flight, so that older response
   * can no longer land on top of the fresh one.
   *
   * No answer, forced or not, replaces a status read after it (see
   * `isOvertakenByHeld`): a page that rendered while this read was in flight
   * may already have handed the store a newer snapshot. Its callers then get
   * that one.
   */
  fetchStatus: async (options = {}) => {
    const inFlight = get().inFlight;
    if (inFlight && !options.force) return inFlight;

    statusRequest?.abort();
    const controller = new AbortController();
    statusRequest = controller;

    const requestId = get().requestId + 1;
    set({ requestId, fetching: true });

    const request = (async () => {
      try {
        const { httpStatus, body, fetchedAt, sentAt } = await readStatus(
          controller.signal,
        );
        // Superseded by a newer (forced) request or a reset — drop this
        // result rather than overwriting fresher data with it, and hand the
        // callers who joined this read the newer one's answer instead.
        if (get().requestId !== requestId) return get().inFlight ?? get().status;
        if (httpStatus === 401) {
          // The session is gone. The server action this replaced redirected
          // to /session-expired on a 401; keep that, as a full page load —
          // that page is what clears the session properly.
          stopPollEngine();
          window.location.assign("/session-expired");
          return null;
        }
        if (body?.success && body.data) {
          if (fetchedAt !== null && isOvertakenByHeld(fetchedAt, sentAt, false)) {
            return get().status;
          }
          set({
            status: body.data,
            // An unstamped answer leaves the held stamp, and its landing, as
            // they were.
            ...(fetchedAt !== null
              ? { statusFetchedAt: fetchedAt, statusLandedAt: performance.now() }
              : {}),
            loaded: true,
          });
          return body.data;
        }
        set({ loaded: true });
        return null;
      } catch {
        // Offline, or aborted because something newer superseded it.
        if (get().requestId !== requestId) return get().inFlight ?? get().status;
        set({ loaded: true });
        return null;
      } finally {
        if (get().requestId === requestId) {
          set({ fetching: false, inFlight: null });
        }
        if (statusRequest === controller) statusRequest = null;
      }
    })();

    set({ inFlight: request });
    return request;
  },

  pollTimer: null,
  pollCount: 0,
  startPolling: (intervalMs = DEFAULT_POLL_MS) => {
    const id = addClaim(
      Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : DEFAULT_POLL_MS,
    );
    let released = false;
    return () => {
      if (released) return;
      released = true;
      releaseClaim(id);
    };
  },
  stopPolling: () => releaseAnyClaim(),

  addSeatsOpen: false,
  openAddSeats: () => set({ addSeatsOpen: true }),
  closeAddSeats: () => set({ addSeatsOpen: false }),

  reset: () => {
    stopPollEngine();
    statusRequest?.abort();
    statusRequest = null;
    set({
      status: null,
      statusFetchedAt: 0,
      statusLandedAt: 0,
      loaded: false,
      fetching: false,
      inFlight: null,
      // Bumped, never rewound: a read still in flight must not match the id
      // of a request issued after the reset.
      requestId: get().requestId + 1,
      pollTimer: null,
      pollCount: 0,
      addSeatsOpen: false,
    });
  },
}));
