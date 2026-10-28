"use client";

import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Download, ImageIcon, ImageOff, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { FOCUS_RING_ON_BLUE, notifySupport, useOpenerFocus } from "@/components/Support/primitives";
import { formatDayAndClock } from "@/lib/supportFormat";
import { formatFileSize } from "@/lib/supportAttachments";
import type { AttachmentDTO } from "@/types/support";
import { startDownload, useAttachmentUrls } from "./attachmentUrls";

export interface LightboxImage {
  file: AttachmentDTO;
  obtainedAt: number;
}

interface ImageLightboxProps {
  images: readonly LightboxImage[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}

const iconButton = cn(
  "flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.14] text-white outline-none transition-colors hover:bg-white/25 disabled:opacity-40",
  FOCUS_RING_ON_BLUE,
);

/** What the open image shows; starts over (fit, not broken, the payload's URL) for every image / re-read. */
interface ViewState {
  /** `${file id}:${obtainedAt}` of the image this state belongs to */
  key: string | null;
  zoomed: boolean;
  broken: boolean;
  src: string | null;
}

/**
 * Image preview, as TD-08 draws it (measured at 2×, 1440×1024): a dark
 * backdrop and, centred in the viewport, one column — the file name (16/500
 * white) with "840 KB · Md Rakhiul Hasan · Today, 2:14 PM" (14px, white/80)
 * and zoom / download / close as 40px glass squares 12px apart, right-aligned
 * to the image; 16px below, the image in a 14px-radius frame, 1000px wide at
 * most (1000×625 for a 16:10 screenshot). The column follows the image's
 * aspect ratio, so a tall image narrows it instead of overflowing the
 * viewport (extreme ratios are letterboxed on #f6f7f9). Built on the app's
 * Radix dialog (focus trap, Escape, focus returned to the thumbnail); ←/→
 * step through the ticket's images; a stale signed URL re-signs once.
 */
export const ImageLightbox = ({ images, index, onIndexChange }: ImageLightboxProps) => {
  const { hrefFor, ensureFresh, recover } = useAttachmentUrls();
  const current = index !== null ? images[index] ?? null : null;
  const open = current !== null;
  // no Dialog.Trigger: focus goes back to the thumbnail that opened the preview
  const openerFocus = useOpenerFocus(undefined, { preventScroll: true });

  // A new image (or a re-read of this one) starts from a clean view — adjusted during render, so
  // the frame never paints one image with another's zoom or "broken" state.
  const file = current?.file ?? null;
  const obtainedAt = current?.obtainedAt ?? 0;
  const viewKey = file ? `${file.id}:${obtainedAt}` : null;
  const [view, setView] = useState<ViewState>({ key: null, zoomed: false, broken: false, src: null });
  if (view.key !== viewKey) {
    setView({ key: viewKey, zoomed: false, broken: false, src: file ? hrefFor(file, obtainedAt) : null });
  }
  const { zoomed, broken, src } = view;
  const setZoomed = (update: (value: boolean) => boolean) => setView((prev) => ({ ...prev, zoomed: update(prev.zoomed) }));
  /** a (re-)signed URL for the image `forKey` names — null = it cannot be shown */
  const showSrc = useCallback(
    (forKey: string, next: string | null) =>
      setView((prev) => (prev.key !== forKey ? prev : next ? { ...prev, src: next } : { ...prev, broken: true })),
    [],
  );

  // A stale signed URL is re-signed once per image (re-signing elsewhere never resets the zoom).
  useEffect(() => {
    if (!file || viewKey === null) return;
    let cancelled = false;
    void ensureFresh(file, obtainedAt).then((fresh) => {
      if (!cancelled && fresh) showSrc(viewKey, fresh);
    });
    return () => {
      cancelled = true;
    };
  }, [ensureFresh, file, obtainedAt, showSrc, viewKey]);

  const step = (delta: number) => {
    if (index === null || images.length < 2) return;
    onIndexChange((index + delta + images.length) % images.length);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  };

  const download = async () => {
    if (!current) return;
    const url = await ensureFresh(current.file, current.obtainedAt);
    if (url) startDownload(url);
    else notifySupport.error("Couldn't download the image", { description: "Please try again in a moment." });
  };

  const meta = current
    ? [formatFileSize(current.file.byte_size), current.file.uploaded_by?.name, formatDayAndClock(current.file.created_at)]
        .filter(Boolean)
        .join(" · ")
    : "";

  const width = current?.file.width ?? 0;
  const height = current?.file.height ?? 0;
  // the frame's aspect ratio: the image's own (16:10 until the DTO knows its size), kept sane
  const ratio = width > 0 && height > 0 ? Math.min(4, Math.max(0.25, width / height)) : 16 / 10;

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onIndexChange(null) : undefined)}>
      <DialogPortal>
        <DialogOverlay className="bg-headingTextColor/80 backdrop-blur-[1px]" />
        <DialogPrimitive.Content
          onKeyDown={onKeyDown}
          onOpenAutoFocus={openerFocus.onOpenAutoFocus}
          onCloseAutoFocus={openerFocus.onCloseAutoFocus}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 outline-none [--lb-chrome:76px] sm:p-8 sm:[--lb-chrome:120px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        >
          {current ? (
            <div
              className="flex w-full flex-col"
              style={{
                // ≤ 1000px, and no wider than the viewport height allows at this aspect ratio
                maxWidth: `min(1000px, calc((100dvh - var(--lb-chrome)) * ${ratio.toFixed(4)}))`,
                minWidth: "min(100%, 320px)",
              }}
            >
              <header className="flex items-center gap-3 pb-3 sm:pb-4">
                <ImageIcon aria-hidden="true" className="hidden size-5 shrink-0 text-white sm:block" />
                <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-3">
                  <DialogTitle className="truncate text-[15px] font-medium leading-6 text-white sm:text-[16px]">
                    {current.file.file_name}
                  </DialogTitle>
                  <DialogDescription className="truncate text-[13px] leading-5 text-white/80 sm:text-[14px]">
                    {meta}
                    {images.length > 1 && index !== null ? ` · ${index + 1} of ${images.length}` : ""}
                  </DialogDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomed((value) => !value)}
                  aria-pressed={zoomed}
                  aria-label={zoomed ? "Fit to screen" : "Zoom to actual size"}
                  className={iconButton}
                  disabled={broken}
                >
                  {zoomed ? <ZoomOut aria-hidden="true" className="size-5" /> : <ZoomIn aria-hidden="true" className="size-5" />}
                </button>
                <button type="button" onClick={() => void download()} aria-label={`Download ${current.file.file_name}`} className={iconButton}>
                  <Download aria-hidden="true" className="size-5" />
                </button>
                <DialogPrimitive.Close aria-label="Close preview" className={iconButton}>
                  <X aria-hidden="true" className="size-5" />
                </DialogPrimitive.Close>
              </header>

              <div className="relative">
                <div
                  className={cn(
                    "flex w-full items-center justify-center overflow-hidden rounded-[14px] bg-bgSecondary dark:bg-darkSecondaryBg",
                    zoomed ? "cursor-zoom-out items-start justify-start overflow-auto" : "cursor-zoom-in",
                  )}
                  style={{ aspectRatio: ratio, maxHeight: "calc(100dvh - var(--lb-chrome))" }}
                  onClick={() => !broken && setZoomed((value) => !value)}
                >
                  {src && !broken ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={current.file.file_name}
                      referrerPolicy="no-referrer"
                      className={cn("select-none", zoomed ? "max-w-none" : "size-full object-contain")}
                      draggable={false}
                      onError={() => {
                        const forKey = viewKey;
                        if (forKey === null) return;
                        void recover(current.file).then((next) => showSrc(forKey, next));
                      }}
                    />
                  ) : (
                    <p className="flex flex-col items-center gap-2 px-4 text-center text-[14px] leading-5 text-subTextColor dark:text-darkTextSecondary">
                      <ImageOff aria-hidden="true" className="size-8" />
                      This image can&apos;t be shown. Try downloading it instead.
                    </p>
                  )}
                </div>
                {images.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      aria-label="Previous image"
                      className={cn(iconButton, "absolute left-3 top-1/2 z-10 -translate-y-1/2 bg-headingTextColor/55 hover:bg-headingTextColor/70")}
                    >
                      <ChevronLeft aria-hidden="true" className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      aria-label="Next image"
                      className={cn(iconButton, "absolute right-3 top-1/2 z-10 -translate-y-1/2 bg-headingTextColor/55 hover:bg-headingTextColor/70")}
                    >
                      <ChevronRight aria-hidden="true" className="size-5" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default ImageLightbox;
