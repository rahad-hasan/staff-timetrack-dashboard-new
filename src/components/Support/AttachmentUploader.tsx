"use client";

import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FileText, ImagePlus, Loader2, RefreshCcw, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  SUPPORT_ATTACHMENT_ACCEPT,
  formatFileSize,
  normalisePastedFile,
} from "@/lib/supportAttachments";
import type {
  AddFilesResult,
  AttachmentUploadItem,
} from "@/hooks/useAttachmentUploads";

interface AttachmentUploaderProps {
  items: AttachmentUploadItem[];
  max: number;
  onAddFiles: (files: File[]) => AddFilesResult;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  disabled?: boolean;
  /**
   * Pasting a file anywhere inside this element (or on the page body when
   * nothing is focused) adds it. Defaults to the uploader itself.
   */
  pasteScopeRef?: RefObject<HTMLElement | null>;
  /** Tone of the drop zone copy — a ticket form has more room than a reply box. */
  compact?: boolean;
  className?: string;
}

const MAX_TOASTED_REJECTIONS = 3;

const reportRejections = (rejected: string[]) => {
  rejected.slice(0, MAX_TOASTED_REJECTIONS).forEach((reason) => toast.error(reason));
  const overflow = rejected.length - MAX_TOASTED_REJECTIONS;
  if (overflow > 0) toast.error(`${overflow} more file${overflow === 1 ? "" : "s"} skipped`);
};

const hasFiles = (transfer: DataTransfer | null) =>
  Boolean(transfer && Array.from(transfer.types ?? []).includes("Files"));

const AttachmentUploader = ({
  items,
  max,
  onAddFiles,
  onRemove,
  onRetry,
  disabled,
  pasteScopeRef,
  compact,
  className,
}: AttachmentUploaderProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepthRef = useRef(0);

  const full = items.length >= max;
  const inactive = Boolean(disabled) || full;

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const result = onAddFiles(files);
      if (result.rejected.length > 0) reportRejections(result.rejected);
    },
    [onAddFiles],
  );

  // Paste: Ctrl/Cmd+V with an image (or a copied file) on the clipboard.
  // Text pastes carry no files and fall through untouched.
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (inactive) return;
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length === 0) return;

      const target = event.target as Node | null;
      const scope = pasteScopeRef?.current ?? rootRef.current;
      const insideScope = Boolean(scope && target && scope.contains(target));
      const onPage =
        target === document.body || target === document.documentElement;
      if (!insideScope && !onPage) return;

      // Rich clipboards (Excel / Word cells, some browsers' "copy") carry the
      // text AND a rendered image. Pasted into a field, the text is what the
      // user meant — leave the native paste alone. A pure screenshot has no
      // text and is attached.
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      const text = event.clipboardData?.getData("text/plain") ?? "";
      if (isEditable && text.trim().length > 0) return;

      event.preventDefault();
      addFiles(files.map(normalisePastedFile));
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [addFiles, inactive, pasteScopeRef]);

  // A file dropped anywhere on the page — a missed drop zone, the textarea —
  // would otherwise make the browser navigate to the file and lose the form.
  // Cancel every file drag on the document; a drop inside the form (the same
  // scope as paste) still attaches, anywhere else it is simply ignored.
  useEffect(() => {
    const handleDocumentDragOver = (event: globalThis.DragEvent) => {
      if (!hasFiles(event.dataTransfer)) return;
      if (rootRef.current?.contains(event.target as Node)) return; // zone owns it
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
    };

    const handleDocumentDrop = (event: globalThis.DragEvent) => {
      if (!hasFiles(event.dataTransfer)) return;
      if (rootRef.current?.contains(event.target as Node)) return; // zone owns it
      event.preventDefault();
      if (inactive) return;
      const scope = pasteScopeRef?.current;
      if (scope && scope.contains(event.target as Node)) {
        addFiles(Array.from(event.dataTransfer?.files ?? []));
      }
    };

    document.addEventListener("dragover", handleDocumentDragOver);
    document.addEventListener("drop", handleDocumentDrop);
    return () => {
      document.removeEventListener("dragover", handleDocumentDragOver);
      document.removeEventListener("drop", handleDocumentDrop);
    };
  }, [addFiles, inactive, pasteScopeRef]);

  const openPicker = () => {
    if (inactive) return;
    inputRef.current?.click();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Reset so picking the same file again after removing it fires onChange.
    event.target.value = "";
    addFiles(files);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  // Every file drag is cancelled even while the zone is inactive (full, or a
  // submit in flight): letting the browser handle the drop would navigate
  // the tab to the file and lose the half-written form.
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    if (inactive) return;
    dragDepthRef.current += 1;
    setDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = inactive ? "none" : "copy";
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragging(false);
    if (inactive) return;
    addFiles(Array.from(event.dataTransfer.files ?? []));
  };

  return (
    <div ref={rootRef} className={cn("space-y-2", className)}>
      <div
        role="button"
        tabIndex={inactive ? -1 : 0}
        aria-disabled={inactive}
        aria-label="Add attachments"
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex w-full items-center gap-3 rounded-[8px] border border-dashed border-borderColor bg-white px-4 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:border-darkBorder dark:bg-darkPrimaryBg",
          compact ? "py-3" : "py-5",
          inactive
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-primary/60 hover:bg-primary/5",
          dragging && "border-primary bg-primary/10",
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {dragging ? <ImagePlus className="size-5" /> : <UploadCloud className="size-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
            {full
              ? `Maximum of ${max} attachments reached`
              : dragging
                ? "Drop to attach"
                : compact
                  ? "Drop, browse or paste a screenshot"
                  : "Drop files here, click to browse, or paste a screenshot"}
          </span>
          <span className="block text-xs text-subTextColor dark:text-darkTextSecondary">
            {compact
              ? `Up to 10 MB each · ${items.length}/${max} added`
              : `Images, PDF, Office documents, text and zip · up to 10 MB each · ${items.length}/${max} added`}
          </span>
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={SUPPORT_ATTACHMENT_ACCEPT}
          onChange={handleInputChange}
          disabled={inactive}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {items.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Attachments">
          {items.map((item) => (
            <AttachmentChip
              key={item.id}
              item={item}
              onRemove={() => onRemove(item.id)}
              onRetry={() => onRetry(item.id)}
              disabled={disabled}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
};

interface AttachmentChipProps {
  item: AttachmentUploadItem;
  onRemove: () => void;
  onRetry: () => void;
  disabled?: boolean;
}

const AttachmentChip = ({ item, onRemove, onRetry, disabled }: AttachmentChipProps) => {
  const thumbnail = item.previewUrl ?? item.url;
  const isUploading = item.status === "uploading";
  const isError = item.status === "error";
  // A file named .png whose bytes are not an image cannot be decoded — show
  // the generic icon instead of the browser's broken-image glyph.
  const [thumbnailBroken, setThumbnailBroken] = useState(false);
  useEffect(() => setThumbnailBroken(false), [thumbnail]);

  return (
    <li
      className={cn(
        "relative flex items-center gap-3 overflow-hidden rounded-md border bg-white p-2 text-xs dark:bg-darkPrimaryBg",
        isError
          ? "border-destructive/50"
          : "border-borderColor dark:border-darkBorder",
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-bgSecondary/60 text-subTextColor dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
        {item.isImage && thumbnail && !thumbnailBroken ? (
          // Object URLs and signed bucket URLs cannot go through next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            className="size-full object-cover"
            onError={() => setThumbnailBroken(true)}
          />
        ) : (
          <FileText className="size-5" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block truncate font-medium text-headingTextColor dark:text-darkTextPrimary"
          title={item.name}
        >
          {item.name}
        </span>
        <span className="block text-subTextColor dark:text-darkTextSecondary">
          {isError ? (
            <span className="text-destructive">{item.error}</span>
          ) : isUploading ? (
            item.progress >= 100 ? "Processing…" : `Uploading ${item.progress}%`
          ) : (
            formatFileSize(item.size)
          )}
        </span>
        {isUploading ? (
          <span
            className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-bgSecondary dark:bg-darkSecondaryBg"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={item.progress}
            aria-label={`Uploading ${item.name}`}
          >
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${item.progress}%` }}
            />
          </span>
        ) : null}
      </span>

      <span className="flex shrink-0 items-center gap-1">
        {isUploading ? (
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
        ) : null}
        {isError ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={disabled}
            aria-label={`Retry uploading ${item.name}`}
            title="Retry"
            className="rounded p-1 text-subTextColor hover:text-primary disabled:opacity-50"
          >
            <RefreshCcw className="size-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${item.name}`}
          title="Remove"
          className="rounded p-1 text-subTextColor hover:text-destructive disabled:opacity-50"
        >
          <X className="size-3.5" />
        </button>
      </span>
    </li>
  );
};

export default AttachmentUploader;
