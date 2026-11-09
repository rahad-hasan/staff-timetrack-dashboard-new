import { create } from "zustand";

/**
 * Live chat UI state.
 *
 * Everything here mirrors Crisp and is written only by `useCrispSession`.
 * Components read it; they never set it, because Crisp stays the source of
 * truth for whether the chat is open or unread.
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
  unreadCount: number;
}

interface LiveChatState extends LiveChatRuntime {
  sync: (patch: Partial<LiveChatRuntime>) => void;
  markLoaded: () => void;
  resetRuntime: () => void;
}

const INITIAL_RUNTIME: LiveChatRuntime = {
  status: "idle",
  loadCount: 0,
  isOpen: false,
  engaged: false,
  unreadCount: 0,
};

export const useLiveChatStore = create<LiveChatState>()((set) => ({
  ...INITIAL_RUNTIME,
  sync: (patch) => set(patch),
  markLoaded: () =>
    set((state) => ({ status: "ready", loadCount: state.loadCount + 1 })),
  resetRuntime: () => set(INITIAL_RUNTIME),
}));
