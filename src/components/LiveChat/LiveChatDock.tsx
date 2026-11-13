"use client";

import { useEffect, useRef } from "react";
import { LIVE_CHAT_COPY } from "@/lib/liveChat/config";
import { useLiveChat } from "@/lib/liveChat/useLiveChat";
import { useDialogOpen } from "@/lib/onboarding/useDialogOpen";
import { cn } from "@/lib/utils";
import LiveChatLauncher from "./LiveChatLauncher";

/**
 * Space the launcher claims in the bottom-right corner: its 3.5rem plus a
 * 0.75rem gap. The onboarding checklist reads this to stack above it instead
 * of under it.
 */
const OFFSET_PROPERTY = "--live-chat-launcher-offset";
const LAUNCHER_FOOTPRINT = "4.25rem";

/**
 * The bottom-right launcher. Crisp's own UI stays hidden until a
 * conversation is open, so this is the only way in.
 *
 * Layering: `z-110` sits above the billing takeovers (`z-[100]`), because an
 * account blocked on payment is exactly who needs a human. It sits below the
 * tour spotlight (`z-[9990]`), which dims it like the rest of the page.
 */
export default function LiveChatDock() {
  const { isReady, isOpen, unreadCount, open } = useLiveChat();
  const dialogOpen = useDialogOpen();

  const launcherRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  // Steps aside while the chat is open (Crisp shows its own close button),
  // and while a Radix modal is up. The modal puts `pointer-events: none` on
  // <body>, so a launcher left floating over it would look live and do nothing.
  const hidden = isOpen || dialogOpen;

  useEffect(() => {
    if (!isReady) return;
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty(OFFSET_PROPERTY, LAUNCHER_FOOTPRINT);
    return () => {
      rootStyle.removeProperty(OFFSET_PROPERTY);
    };
  }, [isReady]);

  // Closing the chat hands focus back to the corner the user left from.
  // Only when they opened it from here: a chat Crisp opened by itself must not
  // pull focus out of whatever the user is typing in.
  useEffect(() => {
    if (isOpen || !restoreFocus.current) return;
    restoreFocus.current = false;
    launcherRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  const handleOpen = () => {
    restoreFocus.current = true;
    open();
  };

  // Until Crisp has loaded there is nothing behind the button. Content
  // blockers often stop it from loading at all; then nothing ever shows.
  if (!isReady) return null;

  return (
    <>
      {/* `inert` takes a hidden dock out of the tab order and the
          accessibility tree. */}
      <aside
        aria-label={LIVE_CHAT_COPY.region}
        inert={hidden}
        className={cn(
          "fixed right-4 bottom-4 z-110 print:hidden",
          // Fades and rises 12px into place when it first appears and when it
          // comes back; plain CSS, so no animation library ships in the shell.
          // Reduced motion keeps the fade and drops the movement.
          "transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-opacity",
          "starting:translate-y-3 starting:opacity-0",
          hidden && "translate-y-3 opacity-0",
        )}
      >
        <LiveChatLauncher
          ref={launcherRef}
          unreadCount={unreadCount}
          onClick={handleOpen}
        />
      </aside>

      {/* The badge is silent, so a screen reader hears replies here. It sits
          outside the dock because an `inert` dock (during a dialog) would
          mute it too. */}
      <p role="status" className="sr-only">
        {unreadCount > 0 ? LIVE_CHAT_COPY.unreadAnnouncement(unreadCount) : ""}
      </p>
    </>
  );
}
