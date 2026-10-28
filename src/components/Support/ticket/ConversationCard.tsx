"use client";

import { useId, type ReactNode } from "react";
import { MessageSquareText } from "lucide-react";
import { CountPill, LiveIndicator, useLiveStatus } from "@/components/Support/primitives";
import { messagesLabel } from "./ticketCopy";

interface ConversationCardProps {
  /** `public_message_count` (the description counts as the first message) */
  messageCount: number;
  /** the support socket is connected */
  connected: boolean;
  /** the timeline, the state banner and the composer */
  children: ReactNode;
}

/**
 * The conversation card (TD-01): a 66px header — 32px blue tile, "Conversation" 18/500, the
 * "4 messages" pill (24px / 12px) and the Live pill — over the thread, the state banner and the
 * composer inside 24px of padding.
 */
export function ConversationCard({ messageCount, connected, children }: ConversationCardProps) {
  const headingId = useId();
  const live = useLiveStatus(connected);
  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 rounded-2xl border border-borderColor bg-white dark:border-darkBorder dark:bg-darkSecondaryBg"
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-borderColor px-4 py-[17px] sm:px-6 dark:border-darkBorder">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <MessageSquareText className="size-[18px]" />
        </span>
        <h2 id={headingId} className="text-[18px] font-medium leading-7 text-headingTextColor dark:text-darkTextPrimary">
          Conversation
        </h2>
        <CountPill>{messagesLabel(messageCount)}</CountPill>
        <LiveIndicator
          tone="surface"
          status={live}
          className="ml-auto"
          liveTitle="New replies appear here automatically"
          offlineTitle="Reconnecting — new replies will appear when the connection is back"
        />
      </header>
      <div className="px-4 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}
