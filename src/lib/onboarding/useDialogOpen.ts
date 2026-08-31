"use client";

import { useEffect, useState } from "react";

/**
 * Is a Radix dialog currently mounted?
 *
 * This exists because of a z-index collision that would otherwise break the
 * most important thing the tour does. The spotlight sits at `z-[9990]` so it
 * can dim the sidebar (`z-[50]`) and the header, but `DialogContent` renders
 * at `z-50` — so the moment the user clicks the highlighted "Add Client"
 * button, the dialog they were told to open appears *underneath* the backdrop,
 * unreachable.
 *
 * Rather than fight it with ever-larger z-indexes, the tour simply steps
 * aside: while a dialog is open the overlay and tooltip stop rendering, and
 * the tour resumes — same step, same position — when it closes. Which is also
 * the better behaviour, since the dialog is now what the user is looking at.
 *
 * Detection is on `[data-slot="dialog-content"]`, the attribute the shared
 * `components/ui/dialog.tsx` stamps on every dialog in the app — plus
 * `sheet-content`, its drawer twin: the mobile burger nav is a Sheet, and on
 * steps whose spotlight hole is taller than the viewport (the download
 * finale on a phone) the click shield cannot cover the header, so the sheet
 * really can open mid-tour. The tour steps aside for it like any dialog.
 */
const DIALOG_SELECTOR =
  '[data-slot="dialog-content"], [data-slot="sheet-content"]';

export function useDialogOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const read = () =>
      setOpen(document.querySelector(DIALOG_SELECTOR) !== null);

    read();

    // Radix portals dialogs to the end of <body> and removes them on close,
    // so watching the body's subtree catches both transitions.
    const observer = new MutationObserver(read);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return open;
}
