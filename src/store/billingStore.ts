import { create } from "zustand";
import { IBillingStatus } from "@/types/billing";
import { getBillingStatus } from "@/actions/billing/action";

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

  pollTimer: ReturnType<typeof setInterval> | null;
  /**
   * The poll timer is SHARED and reference-counted: several surfaces (payment
   * banner, billing page, pending-payment dialogs) can hold a claim at once,
   * and the interval only clears when the last claim is released. Callers must
   * balance every startPolling with exactly one stopPolling (start in a mount
   * effect, stop in its cleanup).
   */
  pollCount: number;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;

  addSeatsOpen: boolean;
  openAddSeats: () => void;
  closeAddSeats: () => void;
}

export const useBillingStore = create<BillingStore>()((set, get) => ({
  status: null,
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
   * supersedes whatever was in flight, so that older response can no longer
   * land on top of the fresh one.
   */
  fetchStatus: async (options = {}) => {
    const inFlight = get().inFlight;
    if (inFlight && !options.force) return inFlight;

    const requestId = get().requestId + 1;
    set({ requestId, fetching: true });

    const request = (async () => {
      try {
        const res = await getBillingStatus();
        // Superseded by a newer (forced) request — drop this result rather than
        // overwriting fresher data with it.
        if (get().requestId !== requestId) return get().status;
        if (res?.success && res.data) {
          set({ status: res.data, loaded: true });
          return res.data;
        }
        set({ loaded: true });
        return null;
      } finally {
        if (get().requestId === requestId) {
          set({ fetching: false, inFlight: null });
        }
      }
    })();

    set({ inFlight: request });
    return request;
  },

  pollTimer: null,
  pollCount: 0,
  startPolling: (intervalMs = 5000) => {
    const { pollCount, pollTimer } = get();
    set({ pollCount: pollCount + 1 });
    if (pollTimer) return;
    const timer = setInterval(() => {
      void get().fetchStatus();
    }, intervalMs);
    set({ pollTimer: timer });
  },
  stopPolling: () => {
    const { pollCount, pollTimer } = get();
    const remaining = Math.max(0, pollCount - 1);
    set({ pollCount: remaining });
    if (remaining === 0 && pollTimer) {
      clearInterval(pollTimer);
      set({ pollTimer: null });
    }
  },

  addSeatsOpen: false,
  openAddSeats: () => set({ addSeatsOpen: true }),
  closeAddSeats: () => set({ addSeatsOpen: false }),
}));
