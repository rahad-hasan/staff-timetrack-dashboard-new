"use client";

import type { Ref } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIVE_CHAT_COPY } from "@/lib/liveChat/config";
import { LIVE_CHAT_ACTION } from "./styles";

interface LiveChatLauncherProps {
  ref?: Ref<HTMLButtonElement>;
  unreadCount: number;
  onClick: () => void;
}

/** The round chat button that stays in the corner. */
export default function LiveChatLauncher({
  ref,
  unreadCount,
  onClick,
}: LiveChatLauncherProps) {
  const label =
    unreadCount > 0
      ? LIVE_CHAT_COPY.launcherWithUnread(unreadCount)
      : LIVE_CHAT_COPY.launcher;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        LIVE_CHAT_ACTION,
        "pointer-events-auto relative grid size-14 shrink-0 place-items-center rounded-full bg-live-chat-fab shadow-live-chat-fab",
      )}
    >
      <MessageSquare
        className="size-6 fill-current"
        strokeWidth={1.5}
        absoluteStrokeWidth
        aria-hidden="true"
      />
      {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
    </button>
  );
}

/** Visual only: the count is already in the launcher's accessible name. */
function UnreadBadge({ count }: { count: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] leading-none font-bold text-white ring-2 ring-bgPrimary dark:ring-darkPrimaryBg"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
