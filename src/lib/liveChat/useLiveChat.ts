"use client";

import { useShallow } from "zustand/react/shallow";
import { useLiveChatStore } from "@/store/liveChatStore";
import { crispDo } from "./crisp";

/**
 * Open the conversation. Safe to call from anywhere, at any time. Before Crisp
 * has loaded, the command waits in its queue and runs on load.
 */
export function openLiveChat() {
  crispDo("chat:show");
  crispDo("chat:open");
}

/**
 * The live chat as any component needs it: the read-only state plus the one
 * action. A "Chat with us" button elsewhere in the app needs nothing more.
 */
export function useLiveChat() {
  const state = useLiveChatStore(
    useShallow((store) => ({
      isReady: store.status === "ready",
      isOpen: store.isOpen,
      isAvailable: store.isAvailable,
      unreadCount: store.unreadCount,
    })),
  );

  return { ...state, open: openLiveChat };
}
