"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type RefObject,
} from "react";
import { CloudUpload, FileText, Loader2, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SUPPORT_ATTACHMENT_ACCEPT,
  formatFileSize,
  normalisePastedFile,
} from "@/lib/supportAttachments";
import type { SupportUploadItem, SupportUploads } from "@/components/Support/primitives";
import { FOCUS_RING } from "@/components/Support/primitives";

interface AttachmentUploaderProps {
  uploads: SupportUploads;
  disabled?: boolean;
  /** pasting a file anywhere inside this element (or on the bare page) attaches it */
  pasteScopeRef?: RefObject<HTMLElement | null>;
  /** id of the visible label, for the drop zone's accessible name */
  labelId?: string;
  className?: string;
}

const MAX_LISTED_REJECTIONS = 4;

const hasFiles = (transfer: DataTransfer | null) =>
  Boolean(transfer && Array.from(transfer.types ?? []).includes("Files"));

/**
 * Create-form attachments (not drawn — built from the support tokens):
 * a dashed drop zone (click / Enter / Space to browse, drop, or paste a
 * screenshot anywhere in the form) and one row per file with its preview,
 * size or upload progress (`role="progressbar"`), Retry and Remove.
 * Uploads run immediately through `useSupportUploads` (3 in parallel,
 * abortable); the client mirror of the policy rejects wrong types, empty
 * files, > 10 MB and the 11th file inline, and the API's own refusals
 * (magic-byte sniffing, 413, 422) land on the file's row.
 */
export const AttachmentUploader = ({
  uploads,
  disabled = false,
  pasteScopeRef,
  labelId,
  className,
}: AttachmentUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLButtonElement>(null);
  const textId = useId();
  const hintId = useId();
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const dragDepth = useRef(0);
  const { addFiles, isFull, max, items } = uploads;
  const inactive = disabled || isFull;

  const add = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const result = addFiles(files);
      setRejected(result.rejected);
    },
    [addFiles],
  );

  // Paste: an image or file on the clipboard, inside the form (or with nothing focused).
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (inactive) return;
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length === 0) return;
      const target = event.target as Node | null;
      const scope = pasteScopeRef?.current ?? zoneRef.current;
      const inScope = Boolean(scope && target && scope.contains(target));
      const onPage = target === document.body || target === document.documentElement;
      if (!inScope && !onPage) return;
      // A rich copy (spreadsheet cells) carries text AND an image: into a text field the text wins.
      const editable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (editable && (event.clipboardData?.getData("text/plain") ?? "").trim().length > 0) return;
      event.preventDefault();
      add(files.map(normalisePastedFile));
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [add, inactive, pasteScopeRef]);

  // A file dropped outside the zone must not navigate the tab away from a half-written ticket.
  useEffect(() => {
    const onDragOver = (event: globalThis.DragEvent) => {
      if (!hasFiles(event.dataTransfer)) return;
      if (zoneRef.current?.contains(event.target as Node)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
    };
    const onDrop = (event: globalThis.DragEvent) => {
      if (!hasFiles(event.dataTransfer)) return;
      if (zoneRef.current?.contains(event.target as Node)) return;
      event.preventDefault();
      if (inactive) return;
      const scope = pasteScopeRef?.current;
      if (scope && scope.contains(event.target as Node)) add(Array.from(event.dataTransfer?.files ?? []));
    };
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, [add, inactive, pasteScopeRef]);

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // picking the same file again after a remove must fire onChange
    add(files);
  };

  const onDragEnter = (event: DragEvent<HTMLButtonElement>) => {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    if (inactive) return;
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragOver = (event: DragEvent<HTMLButtonElement>) => {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = inactive ? "none" : "copy";
  };
  const onDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    if (!hasFiles(event.dataTransfer)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (inactive) return;
    add(Array.from(event.dataTransfer.files ?? []));
  };

  const shownRejections = rejected.slice(0, MAX_LISTED_REJECTIONS);
  const hiddenRejections = rejected.length - shownRejections.length;

  return (
    <div className={cn("space-y-2.5", className)}>
      <button
        ref={zoneRef}
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        disabled={inactive}
        // The name carries every visible word of the zone (field label + prompt + hint), so it
        // contains the visible text (WCAG 2.5.3 label in name); the hint is therefore not also a
        // description. Without `labelId` the content names the button the same way.
        aria-labelledby={labelId ? `${labelId} ${textId} ${hintId}` : undefined}
        data-support-dropzone
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-3.5 text-left outline-none transition-colors duration-150",
          FOCUS_RING,
          dragging
            ? "border-primary bg-support-primary-tint"
            : "border-support-border-hover bg-white hover:border-primary/60 hover:bg-[#fafcff] dark:border-darkBorder dark:bg-darkPrimaryBg",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-support-border-hover disabled:hover:bg-white",
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-support-primary-soft text-primary dark:bg-primary/20"
        >
          <CloudUpload size={18} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            id={textId}
            className="block text-[14px] font-medium leading-5 text-headingTextColor dark:text-darkTextPrimary"
          >
            {isFull
              ? `You've added the maximum of ${max} files`
              : dragging
                ? "Drop to attach"
                : (
                    <>
                      Drop files here, <span className="text-support-primary-text dark:text-support-primary-text-dark">browse</span>, or paste a screenshot
                    </>
                  )}
          </span>{" "}
          {/* a white-space run between the two block lines: never rendered, but keeps the zone's
              text "…screenshot Images…" rather than "…screenshotImages…" for text-based checks */}
          <span
            id={hintId}
            className="block text-[12.5px] leading-[18px] text-support-muted-text dark:text-darkTextSecondary"
          >
            Images, PDF, Office, text or zip · up to 10 MB each · {items.length}/{max}
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={SUPPORT_ATTACHMENT_ACCEPT}
        onChange={onPick}
        disabled={inactive}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        data-support-file-input
      />

      <div aria-live="polite" className="empty:hidden">
        {shownRejections.length > 0 ? (
          <ul className="space-y-0.5 rounded-lg bg-[#fef2f2] px-3 py-2 text-[12.5px] leading-[18px] text-[#9f0712] dark:bg-[#fb2c36]/15 dark:text-[#ffa2a2]">
            {shownRejections.map((line) => (
              <li key={line} className="break-words">
                {line}
              </li>
            ))}
            {hiddenRejections > 0 ? (
              <li>
                {hiddenRejections} more file{hiddenRejections === 1 ? "" : "s"} skipped
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {items.length > 0 ? (
        <ul aria-label="Attachments" className="grid gap-2 @min-[560px]/form:grid-cols-2">
          {items.map((item) => (
            <AttachmentRow
              key={item.localId}
              item={item}
              disabled={disabled}
              onRemove={() => uploads.remove(item.localId)}
              onRetry={() => uploads.retry(item.localId)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
};

interface AttachmentRowProps {
  item: SupportUploadItem;
  disabled: boolean;
  onRemove: () => void;
  onRetry: () => void;
}

const AttachmentRow = ({ item, disabled, onRemove, onRetry }: AttachmentRowProps) => {
  const [previewBroken, setPreviewBroken] = useState(false);
  const busy = item.status === "uploading" || item.status === "queued";
  const failed = item.status === "error";
  const preview = item.isImage && item.previewUrl && !previewBroken ? item.previewUrl : null;
  const progress = item.status === "queued" ? 0 : item.progress;
  // The API prefixes refusals with the file name, which the row already shows.
  const error = item.error?.startsWith(`${item.name}: `) ? item.error.slice(item.name.length + 2) : item.error;

  return (
    <li
      data-upload-status={item.status}
      className={cn(
        "relative flex min-w-0 items-center gap-3 rounded-lg border bg-white p-2 pr-1.5 dark:bg-darkPrimaryBg",
        failed ? "border-[#ffc9c9] bg-[#fffafa]" : "border-borderColor dark:border-darkBorder",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-bgSecondary text-support-muted-text dark:bg-darkSecondaryBg"
      >
        {preview ? (
          // An object URL of the local file: next/image cannot optimise it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" onError={() => setPreviewBroken(true)} />
        ) : (
          <FileText size={18} strokeWidth={1.75} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[13px] font-medium leading-[18px] text-headingTextColor dark:text-darkTextPrimary"
          title={item.name}
        >
          {item.name}
        </span>
        <span
          // A refusal is read, not skimmed: it wraps (2 lines) instead of being cut, full text on hover.
          title={failed ? error || undefined : undefined}
          className={cn(
            "block text-[12px] leading-[16px]",
            failed ? "line-clamp-2 break-words text-[#c10007]" : "truncate text-support-muted-text dark:text-darkTextSecondary",
          )}
        >
          {failed
            ? error || "Upload failed"
            : item.status === "queued"
              ? "Waiting…"
              : item.status === "uploading"
                ? progress >= 100
                  ? "Processing…"
                  : `Uploading ${progress}%`
                : formatFileSize(item.size)}
        </span>
        {busy ? (
          <span
            role="progressbar"
            aria-label={`Uploading ${item.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-[#eef1f1] dark:bg-white/10"
          >
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-200 motion-reduce:transition-none"
              style={{ width: `${Math.max(4, progress)}%` }}
            />
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center">
        {busy ? (
          <Loader2 aria-hidden="true" size={16} className="mr-1 text-primary motion-safe:animate-spin" />
        ) : null}
        {failed ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={disabled}
            aria-label={`Retry uploading ${item.name}`}
            className={cn("flex size-7 items-center justify-center rounded-md text-subTextColor outline-none transition-colors hover:bg-support-surface-muted hover:text-primary disabled:opacity-50", FOCUS_RING)}
          >
            <RotateCcw aria-hidden="true" size={15} strokeWidth={2} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${item.name}`}
          className={cn("flex size-7 items-center justify-center rounded-md text-support-muted outline-none transition-colors hover:bg-support-surface-muted hover:text-[#c10007] disabled:opacity-50", FOCUS_RING)}
        >
          <X aria-hidden="true" size={16} strokeWidth={2} />
        </button>
      </span>
    </li>
  );
};

export default AttachmentUploader;
