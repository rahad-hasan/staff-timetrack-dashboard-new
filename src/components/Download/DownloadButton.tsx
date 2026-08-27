"use client";

import type { ComponentProps, ReactNode } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

interface IDownloadButtonProps {
  href: string;
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
 * The one place a release asset is linked.
 *
 * Every download on this page goes through here so the external-link
 * attributes cannot be forgotten on a fourth copy. Note the browser ignores a
 * `download` attribute cross-origin — GitHub's `Content-Disposition:
 * attachment` is what actually forces the save.
 */
const DownloadButton = ({
  href,
  accessibleName,
  children,
  variant,
  size = "lg",
  className,
}: IDownloadButtonProps) => (
  <Button asChild variant={variant} size={size} className={className}>
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={accessibleName}
    >
      <Download aria-hidden className="size-4" />
      {children}
    </a>
  </Button>
);

export default DownloadButton;
