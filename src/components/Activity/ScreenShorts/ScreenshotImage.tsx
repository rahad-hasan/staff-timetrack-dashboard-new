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
  const attemptsRef = useRef(0);
  const mountedRef = useRef(true);
  const srcRef = useRef(src);

  srcRef.current = src;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // A refresh delivered a newly signed URL — give it a clean shot. The
  // attempt budget intentionally survives (see MAX_AUTO_RETRIES).
  useEffect(() => {
    setFailed(false);
    setRecovering(false);
    setRetryNonce(0);
  }, [src]);

  const handleError = () => {
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
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onLoad={() => {
        attemptsRef.current = 0;
        noteScreenshotLoaded();
      }}
      onError={handleError}
      {...rest}
    />
  );
};

export default ScreenshotImage;
