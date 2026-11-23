"use client";

import type { ComponentProps, ReactNode } from "react";
import { Download, ExternalLink, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store/onboardingStore";
import type { TResolvedDownload } from "@/types/releases";

import { isTrustedDownload } from "./downloadSources";

interface IDownloadButtonProps {
  download: TResolvedDownload;
  /**
   * Overrides the accessible name when the visible label alone is ambiguous —
   * e.g. two macOS buttons that both read "Download for macOS".
   *
   * WCAG 2.5.3 (Label in Name): whatever is passed here MUST contain the
   * visible label verbatim, or voice-control users cannot activate the button
   * by speaking what they see. Omit it whenever the visible text is enough.
   */
  accessibleName?: string;
  children: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
}

/**
 * The one place an installer is linked, whether a GitHub release file or the
 * Microsoft Store listing.
 *
 * Every download on this page goes through here so the external-link
 * attributes cannot be forgotten on another copy, and so the source allowlist
 * runs right where the `href` is created, whatever path the URL took to get
 * here. Note the browser ignores a `download` attribute cross-origin —
 * GitHub's `Content-Disposition: attachment` is what actually forces the save.
 */
// Starting a real download is an even more honest signal than the Header
// link's "headed to the download page" — without it, a user the tour (or
// checklist) brought here would install the app and never earn the milestone.
// Opening the Store listing counts too: on Windows it is the download.
// `completeTask` is idempotent, so re-downloads are free. Wired to onAuxClick
// too: a middle-click downloads in a new tab without ever firing click.
const markDownloaded = () =>
  void useOnboardingStore.getState().completeTask("DESKTOP_APP_DOWNLOADED");

const DownloadButton = ({
  download,
  accessibleName,
  children,
  variant,
  size = "lg",
  className,
}: IDownloadButtonProps) => {
  // Callers pass links from `resolveDownload`, which has already checked
  // them. Checked again here so a future caller that skips the resolver gets
  // a dead button, never an untrusted link.
  if (!isTrustedDownload(download)) {
    return (
      <Button size={size} variant="download" className={className} disabled>
        Not available yet
      </Button>
    );
  }

  const isStore = download.source === "microsoft-store";

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a
        href={download.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={accessibleName}
        onClick={markDownloaded}
        onAuxClick={(event) => {
          if (event.button === 1) markDownloaded();
        }}
      >
        {isStore ? (
          <Store aria-hidden className="size-4" />
        ) : (
          <Download aria-hidden className="size-4" />
        )}
        {children}
        {/* The Store opens a web page on another site, not a file
            download, so it gets the usual "leaves this site" cue. */}
        {isStore ? (
          <ExternalLink aria-hidden className="size-3.5 opacity-70" />
        ) : null}
      </a>
    </Button>
  );
};

export default DownloadButton;
