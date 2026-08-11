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
  fetchStatus: () => Promise<IBillingStatus | null>;

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

  /**
   * Concurrent callers SHARE the in-flight request instead of receiving the
   * current (pre-action) snapshot: flows like "Switch to Free" use
   * `await fetchStatus()` as their entire completion handoff, so returning a
   * stale snapshot — because a mount refresh or poll tick happened to be in
   * flight — would leave the blocked takeover mounted after the action
   * actually succeeded.
   */
  fetchStatus: async () => {
    const inFlight = get().inFlight;
    if (inFlight) return inFlight;

    const request = (async () => {
      try {
        const res = await getBillingStatus();
        if (res?.success && res.data) {
          set({ status: res.data, loaded: true });
          return res.data;
        }
        set({ loaded: true });
        return null;
      } finally {
        set({ fetching: false, inFlight: null });
      }
    })();

    set({ fetching: true, inFlight: request });
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
