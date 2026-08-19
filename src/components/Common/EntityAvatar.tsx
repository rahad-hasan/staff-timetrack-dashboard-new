"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { getAvatarPalette, getInitials } from "@/utils/entityAvatar";

type EntityAvatarProps = {
  /** Drives the initials and the deterministic chip colour. */
  label: string;
  /** Bundled artwork, a remote icon URL, or nothing at all. */
  src?: string | StaticImageData | null;
  /**
   * "plate" stands the icon on white: favicons are drawn for a light tab strip,
   * so a dark-on-transparent mark disappears against the dark table. Artwork we
   * ship ourselves already reads on both themes and uses "bare".
   */
  surface?: "plate" | "bare";
  /** Overrides the derived initials (hosts read better than word initials). */
  initials?: string;
  className?: string;
};

/**
 * Square rounded chip for a tracked entity: shows its icon, or a coloured
 * initials tile until — and instead of — one that never arrives.
 */
const EntityAvatar = ({
  label,
  src,
  surface = "plate",
  initials,
  className,
}: EntityAvatarProps) => {
  // Both states hold the src they describe rather than a bare boolean: TanStack
  // reuses row components across sorts and date changes, so a `failed`/`loaded`
  // flag would leak onto whichever entity lands in the row next.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const srcKey = typeof src === "string" ? src : (src?.src ?? null);
  const showImage = Boolean(src) && srcKey !== failedSrc;
  const isLoaded = showImage && srcKey === loadedSrc;

  return (
    <div
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg",
        // The plate only appears once the icon has painted, so the chip never
        // flashes an empty white square while the request is in flight.
        isLoaded
          ? surface === "plate"
            ? "bg-white"
            : "bg-transparent"
          : getAvatarPalette(label),
        className,
      )}
    >
      <span
        className={cn(
          "text-xs font-semibold",
          isLoaded && "invisible",
        )}
      >
        {initials ?? getInitials(label)}
      </span>

      {showImage && src ? (
        <Image
          src={src}
          alt=""
          width={36}
          height={36}
          decoding="async"
          // Keeps the viewer's dashboard URL — and the browsing history it
          // encodes — out of a third-party icon host's logs.
          referrerPolicy="no-referrer"
          className={cn(
            "absolute inset-0 size-full object-contain transition-opacity",
            surface === "plate" ? "p-1.5" : "p-0.5",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setLoadedSrc(srcKey)}
          onError={() => setFailedSrc(srcKey)}
        />
      ) : null}
    </div>
  );
};

export default EntityAvatar;
