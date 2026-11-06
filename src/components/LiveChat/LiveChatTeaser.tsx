"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIVE_CHAT_COPY } from "@/lib/liveChat/config";
import avatarStack from "@/assets/live-chat/avatar-stack.webp";
import PresenceStatus from "./PresenceStatus";
import { LIVE_CHAT_ACTION, LIVE_CHAT_FOCUS_RING } from "./styles";

interface LiveChatTeaserProps {
  isAvailable: boolean;
  onStart: () => void;
  onDismiss: () => void;
}

/**
 * The "Talk to a real human" card above the launcher.
 *
 * `data-live-chat-teaser` is how globals.css hides the card while the
 * onboarding checklist holds the same corner.
 */
export default function LiveChatTeaser({
  isAvailable,
  onStart,
  onDismiss,
}: LiveChatTeaserProps) {
  return (
    <motion.div
      data-live-chat-teaser=""
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="pointer-events-auto flex w-full origin-bottom-right flex-col gap-4 rounded-[20px] border border-transparent bg-bgPrimary bg-live-chat-card p-[18px] shadow-live-chat-card dark:border-darkBorder dark:bg-darkTertiaryBg"
    >
      <div className="relative flex min-w-0 items-center gap-3">
        {/* Decorative: the status line says the same thing in words. Already
            a 2× webp, so it skips the optimizer. */}
        <Image
          src={avatarStack}
          alt=""
          width={86}
          height={36}
          unoptimized
          className="h-auto w-16 shrink-0 sm:w-[86px]"
        />
        <div className="min-w-0">
          {/* Only the title's line makes room for the close button. The status
              line runs underneath it, which is what lets "3 teammates online
              · ~2 min reply" fit on one line in Roboto. */}
          <p className="pr-6 text-base leading-[1.3] font-extrabold tracking-[0.2px] text-headingTextColor dark:text-darkTextPrimary">
            {LIVE_CHAT_COPY.title}
          </p>
          <PresenceStatus isAvailable={isAvailable} className="mt-[3px]" />
        </div>

        {/* 24px hit area around a 16px glyph. The -1 offsets keep the glyph
            flush with the card's padding, where the design puts it. */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label={LIVE_CHAT_COPY.dismiss}
          className={cn(
            LIVE_CHAT_FOCUS_RING,
            // gray-500, not 400: a control's icon needs 3:1 against the card
            // (WCAG 1.4.11), and gray-400 on white is 2.5:1.
            "absolute -top-1 -right-1 grid size-6 cursor-pointer place-items-center rounded-full text-gray-500 transition-colors hover:text-headingTextColor dark:text-gray-400 dark:hover:text-darkTextPrimary",
          )}
        >
          <X className="size-4" strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={onStart}
        className={cn(
          LIVE_CHAT_ACTION,
          "flex h-11 w-full items-center justify-center gap-2 rounded-full bg-live-chat-action pr-5 pl-[18px] text-sm font-bold tracking-[0.2px]",
        )}
      >
        <MessageSquare
          className="size-4.5"
          strokeWidth={2}
          absoluteStrokeWidth
          aria-hidden="true"
        />
        {LIVE_CHAT_COPY.start}
      </button>
    </motion.div>
  );
}
