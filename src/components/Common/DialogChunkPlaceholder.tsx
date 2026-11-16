"use client";

import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DialogChunkPlaceholderProps {
  /** The dialog's own title, so the placeholder is announced like the dialog it stands in for. */
  title: string;
  /** The `DialogContent` class of the dialog being loaded: same width, so nothing jumps on the swap. */
  className?: string;
  titleClassName?: string;
  /** For dialogs whose real title is visually hidden or drawn inside a custom header. */
  hideTitle?: boolean;
}

/**
 * What a lazily loaded form dialog shows until its chunk arrives.
 *
 * The form dialogs (zod, react-hook-form, the calendar, Radix Select — 50 to
 * 90 kB gzipped) are fetched when they are first opened instead of with the
 * page that owns their button. The owner warms the chunk on hover or focus, so
 * this is normally never seen; it covers a click that beats the download.
 *
 * A real `DialogContent`, never `null`: `[data-slot=dialog-content]` is in the
 * DOM from the first frame, which the onboarding tour waits for before it
 * steps aside (useDialogOpen), and focus is trapped and returned exactly as
 * with the loaded dialog. Outside clicks are ignored like on the forms
 * themselves; Escape and the close button still close through the owner.
 *
 * Use as the `loading` of a `next/dynamic` whose loader went through
 * `loadOrReload` (src/lib/lazyChunk.ts), inside the owner's `<Dialog>`.
 */
export function DialogChunkPlaceholder({
  title,
  className,
  titleClassName,
  hideTitle = false,
}: DialogChunkPlaceholderProps) {
  return (
    <DialogContent
      aria-describedby={undefined}
      onInteractOutside={(event) => event.preventDefault()}
      className={className}
    >
      <DialogTitle className={cn(hideTitle && "sr-only", titleClassName)}>
        {title}
      </DialogTitle>
      <div
        role="status"
        aria-label="Loading"
        className="flex justify-center py-10"
      >
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    </DialogContent>
  );
}

/**
 * The same placeholder for dialogs that render their own `<Dialog>` root
 * (opened through an `open` prop instead of living inside the owner's
 * `<Dialog>`): there is no root to sit in until the chunk has loaded, so it
 * brings one. The owner mounts the lazy dialog only while (or once) it is
 * open, so this is always shown open.
 */
export function StandaloneDialogChunkPlaceholder(
  props: DialogChunkPlaceholderProps,
) {
  return (
    <Dialog open>
      <DialogChunkPlaceholder {...props} />
    </Dialog>
  );
}
