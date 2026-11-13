"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { TOUR_ANCHORS } from "@/lib/onboarding/anchors";
import { useLatched } from "@/lib/onboarding/useLatched";
import OverlayErrorBoundary from "@/components/Common/OverlayErrorBoundary";

/**
 * The palette (cmdk, the dialog, the result lists) loads the first time it
 * opens and then stays mounted, so closing it still animates. Hovering or
 * focusing the trigger starts the download early.
 */
const CommandPalette = dynamic(() => import("./CommandPalette"), {
  ssr: false,
});

const preloadPalette = () => {
  // A failed warm-up is harmless: opening the palette retries the chunk.
  import("./CommandPalette").catch(() => undefined);
};

/**
 * Global search / quick actions (⌘K, Ctrl+K).
 *
 * Built here because the orientation tour's first stop points at it and there
 * was nothing to point at: `cmdk` was already a dependency and shadcn's
 * `CommandDialog` was already in `components/ui`, but nothing in the app ever
 * imported it and no global shortcut existed.
 *
 * This file is only what every page needs: the trigger button — the tour's
 * `globalSearch` anchor, so it always renders — and the shortcut. The palette
 * itself lives in `CommandPalette`.
 */
export default function CommandBar() {
  const [open, setOpen] = useState(false);
  const paletteMounted = useLatched(open);

  /**
   * Set when the palette's chunk failed to load (see OverlayErrorBoundary):
   * from then on, until the next full page load, it cannot render.
   */
  const [paletteFailed, setPaletteFailed] = useState(false);
  const handlePaletteError = useCallback(() => setPaletteFailed(true), []);

  /**
   * A palette that cannot render must not open silently: the shortcut and the
   * button used to flip `open` with nothing on screen, for the rest of the
   * page's life. Close it again and say why, with the way out — at the
   * failure and on every later try, as OnboardingGate does for its overlays.
   */
  useEffect(() => {
    if (!paletteFailed || !open) return;

    toast.error("Search couldn't load", {
      id: "command-palette-failed",
      description: "Reload the page to try again.",
      action: { label: "Reload", onClick: () => window.location.reload() },
    });
    setOpen(false);
  }, [paletteFailed, open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return;
      if (!event.metaKey && !event.ctrlKey) return;

      event.preventDefault();
      setOpen((previous) => !previous);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        data-tour={TOUR_ANCHORS.globalSearch}
        onClick={() => setOpen(true)}
        onPointerEnter={preloadPalette}
        onFocus={preloadPalette}
        aria-label="Search and quick actions"
        className="flex h-10 items-center gap-2 rounded-[8px] border border-borderColor px-3 text-sm text-subTextColor transition-colors hover:text-headingTextColor dark:border-darkBorder dark:text-darkTextSecondary dark:hover:text-darkTextPrimary cursor-pointer"
      >
        <Search className="size-4" />
        <span className="hidden xl:inline">Search…</span>
        <kbd className="hidden xl:inline rounded border border-borderColor px-1.5 py-0.5 text-[10px] font-medium dark:border-darkBorder">
          ⌘K
        </kbd>
      </button>

      {paletteMounted && (
        <OverlayErrorBoundary
          label="command-palette"
          onError={handlePaletteError}
        >
          <CommandPalette open={open} onOpenChange={setOpen} />
        </OverlayErrorBoundary>
      )}
    </>
  );
}
