"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useLiveChatStore } from "@/store/liveChatStore";
import {
  CRISP_WEBSITE_ID,
  LIVE_CHAT_LOCALE,
  LIVE_CHAT_SEGMENT,
} from "./config";
import {
  bootCrisp,
  crispConfig,
  crispDo,
  crispIs,
  crispSet,
  crispUnreadCount,
  onCrispEvent,
  onCrispReady,
  shutdownCrisp,
} from "./crisp";
import { resolveSessionToken } from "./sessionToken";

/** Who the support team sees on the other end of the conversation. */
export interface LiveChatVisitor {
  id: number;
  email?: string;
  name?: string;
  role?: string;
  company?: string;
}

/** Read by the `.crisp-client` guard in globals.css. */
const OPEN_ATTRIBUTE = "data-live-chat-open";

/**
 * Crisp's own UI shows only while a conversation is open, because the dock is
 * the launcher. The CSS guard and the SDK's hide/show are both used. The guard
 * covers the frames around every (re)load, when Crisp paints its bubble before
 * the queued `chat:hide` replays. `chat:hide` keeps Crisp's internal state
 * honest. The order is chosen so each `chat:*` call runs while Crisp can see
 * its container (the guard makes it read as already hidden).
 */
function setCrispVisible(visible: boolean) {
  const root = document.documentElement;
  if (visible) {
    root.setAttribute(OPEN_ATTRIBUTE, "");
    crispDo("chat:show");
  } else {
    crispDo("chat:hide");
    root.removeAttribute(OPEN_ATTRIBUTE);
  }
}

/**
 * Binds Crisp to the signed-in user for as long as the calling component is
 * mounted, and mirrors its state into `liveChatStore`. Mount it ONCE, from
 * `LiveChat`. Unmounting (leaving the authenticated shell, i.e. sign-out)
 * unbinds the conversation so the next person on this browser starts clean.
 */
export function useCrispSession(visitor: LiveChatVisitor | null) {
  const userId = visitor?.id;
  const loadCount = useLiveChatStore((state) => state.loadCount);
  const engaged = useLiveChatStore((state) => state.engaged);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!CRISP_WEBSITE_ID || userId === undefined) return;
    const { sync, markLoaded, resetRuntime } = useLiveChatStore.getState();

    const showOpened = () => {
      setCrispVisible(true);
      sync({ isOpen: true, engaged: true, unreadCount: 0 });
    };
    const showClosed = () => {
      setCrispVisible(false);
      sync({ isOpen: false, unreadCount: crispUnreadCount() });
    };
    // Crisp restores an open chat across page loads, so read it, never assume.
    const syncVisibility = () =>
      crispIs("chat:opened") ? showOpened() : showClosed();

    const unsubscribers = [
      onCrispReady(() => {
        syncVisibility();
        markLoaded();
      }),
      onCrispEvent("session:loaded", () => {
        syncVisibility();
        sync({ isAvailable: crispIs("website:available") });
      }),
      onCrispEvent("chat:opened", showOpened),
      onCrispEvent("chat:closed", showClosed),
      // Crisp's bubble is hidden while the chat is closed, so a reply would
      // otherwise land unseen. The launcher badges it instead.
      onCrispEvent("message:received", () => {
        if (!crispIs("chat:opened")) sync({ unreadCount: crispUnreadCount() });
      }),
      onCrispEvent("website:availability:changed", (isAvailable) =>
        sync({ isAvailable }),
      ),
    ];

    sync({ status: "loading" });
    bootCrisp({
      websiteId: CRISP_WEBSITE_ID,
      tokenId: resolveSessionToken(userId),
      locale: LIVE_CHAT_LOCALE,
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      document.documentElement.removeAttribute(OPEN_ATTRIBUTE);
      shutdownCrisp();
      resetRuntime();
    };
  }, [userId]);

  // Identify the visitor, but only once they have opened the chat
  // (`engaged`): there is no reason to send every user's email, role and
  // company to a third party on every page view when most never chat. Typing
  // a message needs an open chat, so the support team never sees an
  // anonymous one. A session reset forgets everything set on the visitor,
  // so this runs again on every load (`loadCount`), and when details change.
  const { email, name, role, company } = visitor ?? {};
  useEffect(() => {
    if (loadCount === 0 || !engaged || userId === undefined) return;

    if (email) crispSet("user:email", email);
    if (name) crispSet("user:nickname", name);
    if (company) crispSet("user:company", company);
    crispSet("session:data", [
      ["user_id", userId],
      ...(role ? [["role", role] as [string, string]] : []),
    ]);
    crispSet("session:segments", [LIVE_CHAT_SEGMENT]);
  }, [loadCount, engaged, userId, email, name, role, company]);

  // Match the chat window to the app's theme rather than the OS.
  useEffect(() => {
    if (loadCount === 0 || !resolvedTheme) return;
    crispConfig("color:mode", resolvedTheme === "dark" ? "dark" : "light");
  }, [loadCount, resolvedTheme]);
}
