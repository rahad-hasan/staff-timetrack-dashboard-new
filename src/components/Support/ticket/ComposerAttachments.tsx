"use client";

import { memo } from "react";
import { CircleAlert, File as FileIcon, Loader2, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/supportAttachments";
import type { SupportUploadItem } from "@/components/Support/primitives";
import { FOCUS_RING } from "@/components/Support/primitives";

interface ComposerAttachmentsProps {
  items: readonly SupportUploadItem[];
  onRemove: (localId: string) => void;
  onRetry: (localId: string) => void;
  disabled?: boolean;
}

/**
 * The composer's upload chips: thumbnail (object URL, revoked by the
 * uploads hook) or a file glyph, the name, then progress / size / the
 * error with Retry, and × to remove (which aborts the upload or deletes
 * the pending row). Status changes are announced politely.
 */
export const ComposerAttachments = memo(function ComposerAttachments({
  items,
  onRemove,
  onRetry,
  disabled = false,
}: ComposerAttachmentsProps) {
  if (items.length === 0) return null;
  const uploading = items.filter((item) => item.status === "uploading" || item.status === "queued").length;
  const failed = items.filter((item) => item.status === "error").length;
  return (
    <div className="px-3 pb-1 sm:px-4">
      <ul className="flex flex-wrap gap-2" aria-label="Attachments">
        {items.map((item) => {
          const busy = item.status === "uploading" || item.status === "queued";
          const error = item.status === "error";
          return (
            <li
              key={item.localId}
              className={cn(
                "relative flex h-11 max-w-full items-center gap-2 overflow-hidden rounded-lg border bg-white pl-1.5 pr-1 sm:max-w-[260px] dark:bg-darkPrimaryBg",
                error ? "border-[#ffc9c9] bg-[#fef2f2] dark:border-[#fb2c36]/40 dark:bg-[#fb2c36]/10" : "border-borderColor dark:border-darkBorder",
              )}
            >
              {item.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.previewUrl} alt="" className="size-8 shrink-0 rounded-md object-cover" />
              ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-support-primary-soft text-primary dark:bg-primary/20">
                  <FileIcon aria-hidden="true" className="size-4" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium leading-[18px] text-headingTextColor dark:text-darkTextPrimary">
                  {item.name}
                </span>
                <span
                  className={cn(
                    "block truncate text-[12px] leading-4",
                    error ? "text-[#c10007] dark:text-[#ffa2a2]" : "text-support-muted-text dark:text-darkTextSecondary",
                  )}
                >
                  {error ? item.error ?? "Upload failed" : busy ? (item.status === "queued" ? "Waiting…" : `Uploading ${item.progress}%`) : formatFileSize(item.size)}
                </span>
              </span>
              {busy ? <Loader2 aria-hidden="true" className="size-4 shrink-0 text-primary motion-safe:animate-spin" /> : null}
              {error ? (
                <button
                  type="button"
                  onClick={() => onRetry(item.localId)}
                  disabled={disabled}
                  aria-label={`Retry uploading ${item.name}`}
                  className={cn("flex size-7 shrink-0 items-center justify-center rounded-md text-[#c10007] outline-none hover:bg-white/70 disabled:opacity-50", FOCUS_RING)}
                >
                  <RotateCw aria-hidden="true" className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onRemove(item.localId)}
                disabled={disabled}
                aria-label={`Remove ${item.name}`}
                className={cn("flex size-7 shrink-0 items-center justify-center rounded-md text-support-muted outline-none transition-colors hover:bg-support-surface-muted hover:text-headingTextColor disabled:opacity-50 dark:hover:bg-white/10", FOCUS_RING)}
              >
                <X aria-hidden="true" className="size-4" />
              </button>
              {busy && item.status === "uploading" ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-primary transition-[width] duration-200"
                  style={{ width: `${Math.max(4, item.progress)}%` }}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="sr-only" aria-live="polite">
        {uploading > 0
          ? `Uploading ${uploading} ${uploading === 1 ? "file" : "files"}.`
          : failed > 0
            ? `${failed} ${failed === 1 ? "file" : "files"} failed to upload.`
            : `${items.length} ${items.length === 1 ? "file" : "files"} attached.`}
      </p>
      {failed > 0 ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] leading-[18px] text-[#c10007] dark:text-[#ffa2a2]">
          <CircleAlert aria-hidden="true" className="size-3.5" />
          Retry or remove the files that failed before sending.
        </p>
      ) : null}
    </div>
  );
});

export default ComposerAttachments;
