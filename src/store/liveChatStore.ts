import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LIVE_CHAT_TEASER_SNOOZE_MS } from "@/lib/liveChat/config";

/**
 * Live chat UI state.
 *
 * Everything except `teaserDismissedAt` mirrors Crisp and is written only by
 * `useCrispSession`. Components read it; they never set it, because Crisp
 * stays the source of truth for whether the chat is open, staffed or unread.
 */

export type LiveChatStatus = "idle" | "loading" | "ready";

interface LiveChatRuntime {
  status: LiveChatStatus;
  /**
   * Bumped on every Crisp (re)load. A `session:reset` wipes the visitor's
   * identity and settings, so effects that apply them depend on this to run
   * again.
   */
  loadCount: number;
  isOpen: boolean;
  /**
   * The user has opened the chat since signing in. Their details go to Crisp
   * only from then on: most users never chat, and a third party has no need
   * to know who they are until they do.
   */
  engaged: boolean;
  /**
   * Starts `true` so the prompt opens with the promise it was designed with.
   * Crisp flips it only when it positively reports nobody available.
   */
  isAvailable: boolean;
  unreadCount: number;
}

interface LiveChatState extends LiveChatRuntime {
  /**
   * Persisted: when the user last closed the teaser card with its X (epoch
   * ms), or `null`. See `isTeaserSnoozed`. Opening the chat does not count:
   * the card is the way back in.
   */
  teaserDismissedAt: number | null;
  sync: (patch: Partial<LiveChatRuntime>) => void;
  markLoaded: () => void;
  dismissTeaser: () => void;
  resetRuntime: () => void;
}

const INITIAL_RUNTIME: LiveChatRuntime = {
  status: "idle",
  loadCount: 0,
  isOpen: false,
  engaged: false,
  isAvailable: true,
  unreadCount: 0,
};

export const useLiveChatStore = create<LiveChatState>()(
  persist(
    (set) => ({
      ...INITIAL_RUNTIME,
      teaserDismissedAt: null,
      sync: (patch) => set(patch),
      markLoaded: () =>
        set((state) => ({ status: "ready", loadCount: state.loadCount + 1 })),
      dismissTeaser: () => set({ teaserDismissedAt: Date.now() }),
      resetRuntime: () => set(INITIAL_RUNTIME),
    }),
    {
      name: "live-chat",
      // v0 kept `teaserDismissed: true` forever, set as soon as the chat had
      // been used once. The flag is dropped, so the card comes back for
      // everyone it was hidden from.
      version: 1,
      migrate: () => ({ teaserDismissedAt: null }),
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ teaserDismissedAt: state.teaserDismissedAt }),
    },
  ),
);

/**
 * Whether a dismissal at `dismissedAt` still keeps the teaser away. A value
 * from the future (the clock moved back, or tampered storage) does not count,
 * so the card can never be hidden indefinitely.
 */
export function isTeaserSnoozed(
  dismissedAt: number | null,
  now = Date.now(),
): boolean {
  if (typeof dismissedAt !== "number") return false;
  const elapsed = now - dismissedAt;
  return elapsed >= 0 && elapsed < LIVE_CHAT_TEASER_SNOOZE_MS;
}
