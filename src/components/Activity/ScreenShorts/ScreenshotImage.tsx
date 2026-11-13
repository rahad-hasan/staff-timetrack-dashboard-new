"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import Image, { ImageProps } from "next/image";
import { useRouter } from "next/navigation";
import { MouseEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  noteScreenshotLoaded,
  recoverScreenshotUrls,
} from "./screenshotRecovery";

type Props = Omit<ImageProps, "onError" | "onLoad"> & {
  fallbackClassName?: string;
};

// Recovery cycles a single image may trigger without ever loading. The budget
// deliberately survives src changes (every recovery pass re-signs the URL) and
// only a successful load resets it, so one permanently dead image can't keep
// requesting route refreshes forever.
const MAX_AUTO_RETRIES = 3;

/**
 * The object a signed URL names: the URL without its query, which holds only
 * the signature and its expiry. Null for anything that is not a URL string.
 */
const objectOf = (src: Props["src"]): string | null => {
  if (typeof src !== "string") return null;
  const query = src.indexOf("?");
  return query === -1 ? src : src.slice(0, query);
};

const ScreenshotImage = ({
  src,
  alt,
  className,
  fallbackClassName,
  ...rest
}: Props) => {
  const router = useRouter();
  const [recovering, setRecovering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  // What the <Image> shows. It is the `src` prop, except while a picture
  // that has already loaded is kept under the URL it loaded from (see below).
  const [shownSrc, setShownSrc] = useState(src);
  const attemptsRef = useRef(0);
  const mountedRef = useRef(true);
  const loadedRef = useRef(false);
  const srcRef = useRef(src);
  const shownRef = useRef(shownSrc);

  srcRef.current = src;
  shownRef.current = shownSrc;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // The same picture under a new signature, and it is already on screen:
    // keep it. Every route re-render re-signs every URL (a live refresh, a
    // revalidating action), and swapping the src made the browser download
    // each visible screenshot again, for an image that cannot have changed.
    // It stands in for the load that swap produced, so it re-arms recovery
    // the same way: a re-signed URL is the proof that refreshes still work.
    const object = objectOf(src);
    if (loadedRef.current && object !== null && object === objectOf(shownRef.current)) {
      noteScreenshotLoaded();
      return;
    }
    // Another picture, or one that never loaded: a refresh delivered a newly
    // signed URL, so give it a clean shot. The attempt budget intentionally
    // survives (see MAX_AUTO_RETRIES).
    loadedRef.current = false;
    setShownSrc(src);
    setFailed(false);
    setRecovering(false);
    setRetryNonce(0);
  }, [src]);

  const handleError = () => {
    loadedRef.current = false;
    // A kept picture asked for again under the URL it was kept with, which
    // may have expired since: the current one is at hand, no recovery needed.
    if (shownRef.current !== srcRef.current) {
      setShownSrc(srcRef.current);
      return;
    }
    if (attemptsRef.current >= MAX_AUTO_RETRIES) {
      setFailed(true);
      return;
    }
    attemptsRef.current += 1;
    const erroredSrc = src;
    setRecovering(true);
    recoverScreenshotUrls(() => router.refresh()).then((outcome) => {
      if (!mountedRef.current) return;
      // The refresh already replaced this image's src — the reset effect owns
      // that path, and remounting here would just reload a healthy image.
      if (srcRef.current !== erroredSrc) return;
      if (outcome === "exhausted") {
        setFailed(true);
        setRecovering(false);
        return;
      }
      // Remount the <Image> so the browser re-requests the URL even when the
      // refreshed payload resolved to the same src string.
      setRetryNonce((nonce) => nonce + 1);
      setRecovering(false);
    });
  };

  if (recovering) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gray-100 dark:bg-darkSecondaryBg text-subTextColor dark:text-darkTextSecondary",
          fallbackClassName,
        )}
      >
        <Loader2 size={18} className="animate-spin text-primary" />
        <p className="text-[10px] opacity-70">Refreshing screenshot…</p>
      </div>
    );
  }

  if (failed) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gray-100 dark:bg-darkSecondaryBg text-subTextColor dark:text-darkTextSecondary",
          fallbackClassName,
        )}
      >
        <button
          type="button"
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            window.location.reload();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <RefreshCcw size={14} />
          Reload
        </button>
        <p className="text-[10px] opacity-70">
          Session expired — please reload
        </p>
      </div>
    );
  }

  return (
    <Image
      key={retryNonce}
      src={shownSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onLoad={() => {
        loadedRef.current = true;
        attemptsRef.current = 0;
        noteScreenshotLoaded();
      }}
      onError={handleError}
      {...rest}
    />
  );
};

export default ScreenshotImage;
