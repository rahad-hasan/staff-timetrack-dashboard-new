"use client";

import { memo, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/Support/primitives";
import { formatAbsolute, formatClock } from "@/lib/supportFormat";
import type { AttachmentDTO } from "@/types/support";
import { MessageFiles, type OpenImageHandler } from "./MessageFiles";

export type BubbleRole = "requester" | "agent";

interface BubbleFrameProps {
  role: BubbleRole;
  name: string;
  image?: string | null;
  createdAt: string;
  body: string;
  files?: readonly AttachmentDTO[];
  obtainedAt: number;
  onOpenImage?: OpenImageHandler;
  edited?: boolean;
  deleted?: boolean;
  /** the optimistic copy of a reply being sent */
  sending?: boolean;
  /** optimistic local previews (object URLs) shown while sending */
  localFiles?: ReactNode;
  /** "Your original request" ribbon on the description */
  label?: string;
}

/** TD-01 role badge: 24px, 12px regular, 11px sides ("Requester" = 77px wide). */
const BADGE: Record<BubbleRole, { text: string; className: string }> = {
  requester: {
    text: "You",
    className: "border-[#ddd6ff] bg-[#f5f3ff] text-[#7008e7] dark:border-[#8e51ff]/45 dark:bg-[#8e51ff]/20 dark:text-[#c4b4ff]",
  },
  agent: {
    text: "Support",
    className: "border-[#bedbff] bg-[#eff6ff] text-[#1447e6] dark:border-[#2b7fff]/40 dark:bg-[#2b7fff]/15 dark:text-support-primary-text-dark",
  },
};

/**
 * One message card in the thread, as TD-01/TD-06 draw them (measured at 2×):
 * a 36px avatar on the timeline rail, flush with the card top, then — 14px
 * to the right — a 12px-radius card (white with the #dce3e3 border for the
 * requester, #f2f7ff with the #bad1fc border for support; 14px top/bottom,
 * 16px sides) holding a 24px row with the name (15/500), the role badge and
 * the 13px clock time on the right, 10px below it the body (15/22,
 * pre-wrapped, long words broken) and the attachments.
 */
export const BubbleFrame = ({
  role,
  name,
  image,
  createdAt,
  body,
  files,
  obtainedAt,
  onOpenImage,
  edited = false,
  deleted = false,
  sending = false,
  localFiles,
  label,
}: BubbleFrameProps) => {
  const badge = BADGE[role];
  const absolute = formatAbsolute(createdAt);
  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 sm:gap-3.5">
      <UserAvatar
        user={{ name, image }}
        size={36}
        className="relative z-[1] ring-4 ring-white dark:ring-darkSecondaryBg"
      />
      <article
        aria-label={role === "requester" ? "Your message" : `Message from ${name}`}
        aria-busy={sending || undefined}
        className={cn(
          "min-w-0 rounded-xl border px-4 py-3.5",
          role === "agent"
            ? "border-[#bad1fc] bg-[#f2f7ff] dark:border-[#2b7fff]/40 dark:bg-[#2b7fff]/10"
            : "border-borderColor bg-white dark:border-darkBorder dark:bg-darkPrimaryBg",
          sending && "opacity-80",
        )}
      >
        <header className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="min-w-0 truncate text-[15px] font-medium leading-[22px] text-headingTextColor dark:text-darkTextPrimary">
            {name}
          </p>
          <span
            className={cn(
              "inline-flex h-6 items-center rounded-full border px-[11px] text-[12px] leading-none",
              badge.className,
            )}
          >
            {badge.text}
          </span>
          {label ? (
            <span className="text-[13px] leading-[18px] text-support-muted-text dark:text-darkTextSecondary">· {label}</span>
          ) : null}
          <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[13px] leading-[18px] text-support-muted-text dark:text-darkTextSecondary">
            {sending ? (
              <>
                <Loader2 aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
                Sending…
              </>
            ) : (
              <>
                {edited ? <span>Edited ·</span> : null}
                <time dateTime={createdAt} title={absolute} suppressHydrationWarning>
                  {formatClock(createdAt)}
                </time>
              </>
            )}
          </span>
        </header>
        {deleted ? (
          <p className="mt-2.5 text-[15px] italic leading-[22px] text-support-muted-text dark:text-darkTextSecondary">
            This message was removed.
          </p>
        ) : body ? (
          <p className="mt-2.5 whitespace-pre-wrap break-words text-[15px] leading-[22px] text-headingTextColor [overflow-wrap:anywhere] dark:text-darkTextPrimary">
            {body}
          </p>
        ) : null}
        {!deleted && files && files.length > 0 ? (
          <MessageFiles files={files} obtainedAt={obtainedAt} onOpenImage={onOpenImage} className={body ? "mt-3" : "mt-2"} />
        ) : null}
        {localFiles}
      </article>
    </div>
  );
};

interface MessageBubbleProps {
  message: {
    id: number;
    author: { name: string | null; image: string | null; role: BubbleRole };
    body: string;
    files: AttachmentDTO[];
    created_at: string;
    edited_at: string | null;
    deleted_at?: string | null;
  };
  /** the requester's own display name (their messages read "You" in the badge) */
  requesterName: string;
  obtainedAt: number;
  onOpenImage?: OpenImageHandler;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  requesterName,
  obtainedAt,
  onOpenImage,
}: MessageBubbleProps) {
  const role: BubbleRole = message.author.role === "agent" ? "agent" : "requester";
  const name =
    role === "requester"
      ? message.author.name?.trim() || requesterName
      : message.author.name?.trim() || "Support team";
  return (
    <BubbleFrame
      role={role}
      name={name}
      image={message.author.image}
      createdAt={message.created_at}
      body={message.body}
      files={message.files}
      obtainedAt={obtainedAt}
      onOpenImage={onOpenImage}
      edited={Boolean(message.edited_at)}
      deleted={Boolean(message.deleted_at)}
    />
  );
});

export default MessageBubble;
