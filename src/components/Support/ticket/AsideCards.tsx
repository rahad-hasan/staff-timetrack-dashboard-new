"use client";

import { memo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Download, Paperclip, Star, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountPill, FOCUS_RING, RatingStars, SupportButton, UnassignedAvatar, UserAvatar } from "@/components/Support/primitives";
import { formatAbsolute, formatDayAndClock } from "@/lib/supportFormat";
import { isImageAttachmentDTO } from "@/lib/supportAttachments";
import { ratingGrade, type AttachmentDTO, type TicketFeedback, type UserRef } from "@/types/support";
import { useAttachmentUrls } from "./attachmentUrls";
import { highlightLabel, highlightToneClass } from "./highlights";
import { DownloadControl, FileGlyph, fileMeta, useDownload, type OpenImageHandler } from "./MessageFiles";

/**
 * Right-column cards in the TD-01 language (measured at 2×): white, 16px
 * radius, #dce3e3 border, 20px padding; a 32px coloured icon tile + 16px
 * title (500 — the requester portal's heading weight; TD-01 draws 600), an
 * optional meta on the right, the content 18px below.
 */
export const AsideCard = ({
  icon,
  tileClass,
  title,
  meta,
  children,
  className,
  headingId,
}: {
  icon: ReactNode;
  tileClass: string;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  headingId: string;
}) => (
  <section
    aria-labelledby={headingId}
    className={cn(
      "rounded-2xl border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg",
      className,
    )}
  >
    <header className="flex items-center gap-3">
      <span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-white [&>svg]:size-[18px]", tileClass)}>
        {icon}
      </span>
      <h2 id={headingId} className="min-w-0 flex-1 truncate text-[16px] font-medium leading-6 text-headingTextColor dark:text-darkTextPrimary">
        {title}
      </h2>
      {meta}
    </header>
    <div className="mt-[18px]">{children}</div>
  </section>
);

/* ───────────────────────────── assigned agent ───────────────────────────── */

export const AgentCard = memo(function AgentCard({ agent }: { agent: UserRef | null }) {
  return (
    <AsideCard
      headingId="ticket-agent-heading"
      icon={<UsersRound />}
      tileClass="bg-[#8e51ff]"
      title="Your agent"
    >
      {agent ? (
        <div className="flex items-center gap-3.5">
          <UserAvatar user={agent} size={48} />
          <div className="min-w-0">
            <p className="truncate text-[16px] font-medium leading-6 text-headingTextColor dark:text-darkTextPrimary">
              {agent.name || "Support team"}
            </p>
            <p className="text-[13.5px] leading-5 text-subTextColor dark:text-darkTextSecondary">Support team</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3.5">
          <UnassignedAvatar size={48} />
          <div className="min-w-0">
            <p className="text-[16px] font-medium leading-6 text-headingTextColor dark:text-darkTextPrimary">Not assigned yet</p>
            <p className="text-[13.5px] leading-5 text-subTextColor dark:text-darkTextSecondary">
              An agent will join the conversation soon.
            </p>
          </div>
        </div>
      )}
    </AsideCard>
  );
});

/* ───────────────────────────── rating ───────────────────────────── */

export const RatingCard = memo(function RatingCard({
  feedback,
  agentName,
  canRate,
  onRate,
}: {
  feedback: TicketFeedback | null;
  agentName: string | null;
  /** the ticket may be rated now and the "Rate this ticket" affordance applies */
  canRate: boolean;
  onRate: () => void;
}) {
  if (!feedback && !canRate) return null;
  return (
    <AsideCard
      headingId="ticket-rating-heading"
      icon={<Star />}
      tileClass="bg-[#f59e0b]"
      title={feedback ? "Your rating" : "Rate this ticket"}
      meta={
        feedback ? (
          <time
            dateTime={feedback.created_at}
            title={formatAbsolute(feedback.created_at)}
            className="shrink-0 text-[13px] leading-5 text-support-muted-text dark:text-darkTextSecondary"
            suppressHydrationWarning
          >
            {formatDayAndClock(feedback.created_at)}
          </time>
        ) : null
      }
    >
      {feedback ? (
        // TD-06 "Requester rating" card, measured at 2×: 64px score box (#fef7eb / #fce1b3), "5.0"
        // 32px, 18px stars 2px apart, 13px grade line; 24px chips; 14/20 quote; blocks 18px apart
        <div className="flex flex-col gap-[18px]">
          <div className="flex items-center gap-3.5 rounded-[10px] border border-[#fce1b3] bg-[#fef7eb] px-4 py-[11px] dark:border-[#f59e0b]/40 dark:bg-[#f59e0b]/10">
            <span className="text-[32px] font-medium leading-10 text-[#bb4d00] dark:text-[#ffd230]">
              {feedback.rating.toFixed(1)}
            </span>
            <span className="min-w-0">
              <RatingStars rating={feedback.rating} size={18} gap={2} />
              <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-subTextColor dark:text-darkTextSecondary">
                {ratingGrade(feedback.rating)}
                {agentName ? ` · for ${agentName}` : ""}
              </span>
            </span>
          </div>
          {feedback.highlights && feedback.highlights.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Highlights">
              {feedback.highlights.map((value) => (
                <li
                  key={value}
                  className={cn(
                    "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium leading-none",
                    highlightToneClass(value),
                  )}
                >
                  <Check aria-hidden="true" className="size-3.5" />
                  {highlightLabel(value)}
                </li>
              ))}
            </ul>
          ) : null}
          {feedback.comment ? (
            <blockquote className="rounded-[10px] bg-bgSecondary px-3.5 py-3 text-[14px] leading-5 text-headingTextColor [overflow-wrap:anywhere] dark:bg-darkTertiaryBg dark:text-darkTextPrimary">
              “{feedback.comment}”
            </blockquote>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[14px] leading-[22px] text-subTextColor dark:text-darkTextSecondary">
            {agentName ? `How did ${agentName} do? ` : "How did we do? "}
            Rate the help you received on this ticket.
          </p>
          <SupportButton
            variant="primary"
            size="md"
            icon={<Star />}
            onClick={onRate}
            className="self-start"
            data-support-rate-trigger=""
          >
            Rate this ticket
          </SupportButton>
        </div>
      )}
    </AsideCard>
  );
});

/* ───────────────────────────── attachments ───────────────────────────── */

const VISIBLE_FILES = 5;

const FileRow = ({
  file,
  obtainedAt,
  onOpenImage,
}: {
  file: AttachmentDTO;
  obtainedAt: number;
  onOpenImage: OpenImageHandler;
}) => {
  const urls = useAttachmentUrls();
  const download = useDownload();
  const image = isImageAttachmentDTO(file);
  const href = urls.hrefFor(file, obtainedAt);
  const [thumbFailed, setThumbFailed] = useState(false);
  return (
    <li className="flex items-center gap-3 rounded-[10px] border border-borderColor py-1.5 pl-1.5 pr-2.5 dark:border-darkBorder">
      {image && href && !thumbFailed ? (
        <button
          type="button"
          onClick={() => onOpenImage(file, obtainedAt)}
          aria-label={`Open image ${file.file_name}`}
          className={cn("size-11 shrink-0 overflow-hidden rounded-lg border border-borderColor outline-none dark:border-darkBorder", FOCUS_RING)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={href}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="size-full object-cover"
            onError={() => {
              void urls.recover(file).then((next) => {
                if (!next) setThumbFailed(true);
              });
            }}
          />
        </button>
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-support-primary-soft text-primary dark:bg-primary/20">
          <FileGlyph file={file} className="size-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium leading-5 text-headingTextColor dark:text-darkTextPrimary" title={file.file_name}>
          {file.file_name}
        </p>
        <p className="truncate text-[12px] leading-[18px] text-support-muted-text dark:text-darkTextSecondary">
          {fileMeta(file)} · <span suppressHydrationWarning>{formatDayAndClock(file.created_at)}</span>
        </p>
      </div>
      <DownloadControl
        href={href}
        onActivate={(event) => void download(event, file, obtainedAt)}
        aria-label={`Download ${file.file_name}`}
        className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-primary outline-none transition-colors hover:bg-[#dbeafe] dark:bg-primary/15", FOCUS_RING)}
      >
        <Download aria-hidden="true" className="size-[18px]" />
      </DownloadControl>
    </li>
  );
};

export const FilesCard = memo(function FilesCard({
  files,
  obtainedAt,
  onOpenImage,
}: {
  files: readonly AttachmentDTO[];
  obtainedAt: number;
  onOpenImage: OpenImageHandler;
}) {
  const [expanded, setExpanded] = useState(false);
  if (files.length === 0) return null;
  const shown = expanded ? files : files.slice(0, VISIBLE_FILES);
  return (
    <AsideCard
      headingId="ticket-files-heading"
      icon={<Paperclip />}
      tileClass="bg-[#00a6f4]"
      title="Attachments"
      meta={
        <CountPill className="h-[23px] shrink-0">
          {files.length} {files.length === 1 ? "file" : "files"}
        </CountPill>
      }
    >
      <ul className="flex flex-col gap-2.5">
        {shown.map((file) => (
          <FileRow key={file.id} file={file} obtainedAt={obtainedAt} onOpenImage={onOpenImage} />
        ))}
      </ul>
      {files.length > VISIBLE_FILES ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className={cn("mt-3 inline-flex items-center gap-1 rounded-md text-[13.5px] font-medium leading-5 text-support-primary-text outline-none hover:underline dark:text-support-primary-text-dark", FOCUS_RING)}
        >
          {expanded ? "Show fewer" : `Show all ${files.length} files`}
          <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </button>
      ) : null}
    </AsideCard>
  );
});
