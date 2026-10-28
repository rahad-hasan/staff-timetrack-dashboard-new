"use client";

import { memo, useState, type HTMLAttributes, type MouseEvent } from "react";
import {
  Download,
  File as FileIcon,
  FileArchive,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  ImageOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING, notifySupport } from "@/components/Support/primitives";
import { fileExtension, formatFileSize, isImageAttachmentDTO } from "@/lib/supportAttachments";
import type { AttachmentDTO } from "@/types/support";
import { startDownload, useAttachmentUrls } from "./attachmentUrls";

export interface OpenImageHandler {
  (file: AttachmentDTO, obtainedAt: number): void;
}

const typeLabel = (file: AttachmentDTO) => {
  const extension = fileExtension(file.file_name);
  if (extension) return extension.toUpperCase();
  if (file.mime_type) return file.mime_type.split("/").pop()?.toUpperCase() ?? "FILE";
  return "FILE";
};

/** "840 KB · PNG" — the admin attachment meta line (TD-01 Attachments card). */
export const fileMeta = (file: AttachmentDTO) =>
  [formatFileSize(file.byte_size), typeLabel(file)].filter(Boolean).join(" · ");

const FileGlyph = ({ file, className }: { file: AttachmentDTO; className?: string }) => {
  const extension = fileExtension(file.file_name);
  const Icon = isImageAttachmentDTO(file)
    ? ImageIcon
    : ["zip"].includes(extension)
      ? FileArchive
      : ["xls", "xlsx", "csv"].includes(extension)
        ? FileSpreadsheet
        : ["pdf", "doc", "docx", "txt", "md", "log", "json", "ppt", "pptx"].includes(extension)
          ? FileText
          : FileIcon;
  return <Icon aria-hidden="true" className={className} />;
};

/** Click handler of every download control: re-signs a stale URL first. */
export const useDownload = () => {
  const urls = useAttachmentUrls();
  return async (event: MouseEvent<HTMLElement>, file: AttachmentDTO, obtainedAt: number) => {
    // modified clicks on a link keep the browser's own behaviour (new tab with the current URL)
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const url = await urls.ensureFresh(file, obtainedAt);
    if (url) startDownload(url);
    else notifySupport.error("Couldn't download the file", { description: "Please try again in a moment." });
  };
};

interface DownloadControlProps extends Omit<HTMLAttributes<HTMLElement>, "onClick"> {
  /** the signed URL, or null when the file has none (`download_url: null` — signing failed) */
  href: string | null;
  onActivate: (event: MouseEvent<HTMLElement>) => void;
}

/**
 * A download control: a link while the file has a URL (open in a new tab, copy link …), a button
 * when it has none — an `<a>` without `href` has no role and no tab stop, so keyboard and screen-
 * reader users could not reach the one control whose click re-signs the URL.
 */
export const DownloadControl = ({ href, onActivate, className, ...rest }: DownloadControlProps) =>
  href ? (
    <a href={href} onClick={onActivate} className={className} {...rest} />
  ) : (
    <button type="button" onClick={onActivate} className={cn("text-left", className)} {...rest} />
  );

interface ImageThumbProps {
  file: AttachmentDTO;
  obtainedAt: number;
  onOpen?: OpenImageHandler;
  /** "single" = one large preview (≤ 280 px wide — TD-01 draws 280×175), "grid" = a 96 px tile */
  layout: "single" | "grid";
}

/**
 * An image attachment as a button that opens the lightbox. Width/height
 * from the DTO reserve the box before the image loads (no layout shift); a
 * load error re-signs the URL once, then falls back to a labelled tile.
 */
export const ImageThumb = memo(function ImageThumb({ file, obtainedAt, onOpen, layout }: ImageThumbProps) {
  const urls = useAttachmentUrls();
  const [broken, setBroken] = useState(false);
  const src = urls.hrefFor(file, obtainedAt);
  const ratio =
    file.width && file.height && file.width > 0 && file.height > 0 ? `${file.width} / ${file.height}` : "16 / 10";
  const single = layout === "single";

  return (
    <button
      type="button"
      onClick={() => onOpen?.(file, obtainedAt)}
      aria-label={`Open image ${file.file_name}`}
      className={cn(
        "group relative block overflow-hidden rounded-lg border border-borderColor bg-bgSecondary outline-none transition-[border-color,box-shadow] hover:border-[#bedbff] dark:border-darkBorder dark:bg-darkTertiaryBg", FOCUS_RING,
        single ? "w-full max-w-[280px]" : "size-24",
      )}
      style={single ? { aspectRatio: ratio, maxHeight: 240 } : undefined}
    >
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={file.file_name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={cn("size-full", single ? "object-contain" : "object-cover")}
          onError={() => {
            void urls.recover(file).then((next) => {
              if (!next) setBroken(true);
            });
          }}
        />
      ) : (
        <span className="flex size-full flex-col items-center justify-center gap-1 px-2 text-center text-[12px] leading-4 text-support-muted-text dark:text-darkTextSecondary">
          <ImageOff aria-hidden="true" className="size-5" />
          <span className="line-clamp-2 break-all">{file.file_name}</span>
        </span>
      )}
    </button>
  );
});

interface FileRowProps {
  file: AttachmentDTO;
  obtainedAt: number;
  className?: string;
}

/** A non-image file (or the line under a single image): glyph, name, size, download. */
export const FileLine = ({ file, obtainedAt, className }: FileRowProps) => {
  const urls = useAttachmentUrls();
  const download = useDownload();
  const href = urls.hrefFor(file, obtainedAt);
  return (
    <DownloadControl
      href={href}
      onActivate={(event) => void download(event, file, obtainedAt)}
      aria-label={`Download ${file.file_name} (${fileMeta(file)})`}
      className={cn(
        "group inline-flex max-w-full items-center gap-1.5 rounded-md text-[14px] leading-5 outline-none", FOCUS_RING,
        className,
      )}
    >
      <FileGlyph file={file} className="size-4 shrink-0 text-primary" />
      <span className="truncate font-medium text-headingTextColor group-hover:underline dark:text-darkTextPrimary">
        {file.file_name}
      </span>
      <span className="shrink-0 text-support-muted-text dark:text-darkTextSecondary">· {formatFileSize(file.byte_size) || typeLabel(file)}</span>
      <Download aria-hidden="true" className="size-4 shrink-0 text-primary" />
    </DownloadControl>
  );
};

/** A file chip (non-image attachments): 36px glyph tile, name, "1.2 MB · PDF", download icon. */
const FileChip = ({ file, obtainedAt }: FileRowProps) => {
  const urls = useAttachmentUrls();
  const download = useDownload();
  const href = urls.hrefFor(file, obtainedAt);
  return (
    <DownloadControl
      href={href}
      onActivate={(event) => void download(event, file, obtainedAt)}
      aria-label={`Download ${file.file_name} (${fileMeta(file)})`}
      className={cn("group flex w-full max-w-[340px] items-center gap-3 rounded-[10px] border border-borderColor bg-white p-2.5 pr-3 outline-none transition-colors hover:border-[#bedbff] hover:bg-[#f8fbff] dark:border-darkBorder dark:bg-darkPrimaryBg dark:hover:bg-white/5", FOCUS_RING)}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-support-primary-soft text-primary dark:bg-primary/20">
        <FileGlyph file={file} className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium leading-5 text-headingTextColor dark:text-darkTextPrimary">
          {file.file_name}
        </span>
        <span className="block text-[12.5px] leading-[18px] text-support-muted-text dark:text-darkTextSecondary">{fileMeta(file)}</span>
      </span>
      <Download aria-hidden="true" className="size-[18px] shrink-0 text-primary transition-transform group-hover:translate-y-px" />
    </DownloadControl>
  );
};

interface MessageFilesProps {
  files: readonly AttachmentDTO[];
  obtainedAt: number;
  onOpenImage?: OpenImageHandler;
  className?: string;
}

/**
 * Attachments inside a bubble (TD-01: one screenshot = a 280×175 bordered
 * preview with the "🖼 name · 840 KB ⬇" line 6px under it). Several images
 * become a row of 96 px tiles; other files are download chips.
 */
export const MessageFiles = memo(function MessageFiles({ files, obtainedAt, onOpenImage, className }: MessageFilesProps) {
  if (files.length === 0) return null;
  const images = files.filter((file) => isImageAttachmentDTO(file));
  const others = files.filter((file) => !isImageAttachmentDTO(file));
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {images.length === 1 ? (
        <div className="flex flex-col gap-1.5">
          <ImageThumb file={images[0]} obtainedAt={obtainedAt} onOpen={onOpenImage} layout="single" />
          <FileLine file={images[0]} obtainedAt={obtainedAt} />
        </div>
      ) : images.length > 1 ? (
        <ul className="flex flex-wrap gap-2" aria-label={`${images.length} images`}>
          {images.map((file) => (
            <li key={file.id}>
              <ImageThumb file={file} obtainedAt={obtainedAt} onOpen={onOpenImage} layout="grid" />
            </li>
          ))}
        </ul>
      ) : null}
      {others.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label={`${others.length} ${others.length === 1 ? "file" : "files"}`}>
          {others.map((file) => (
            <li key={file.id}>
              <FileChip file={file} obtainedAt={obtainedAt} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});

export { FileGlyph };
