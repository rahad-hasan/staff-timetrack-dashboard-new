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

type Props = Omit<
  ImageProps,
  "onError" | "onLoad" | "loading" | "priority" | "fetchPriority"
> & {
  fallbackClassName?: string;
  /**
   * When a grid tile fetches its picture. Leave it unset outside the grids:
   * the browser's own lazy loading.
   * - "eager": one of the first EAGER_SCREENSHOT_TILES tiles. It is in the
   *   server HTML as a high-priority fetch, so the download starts while the
   *   page is still streaming, not after hydration and layout.
   * - "near": every later tile. No <img> until the tile is within NEAR_MARGIN
   *   of the viewport (see whenNear).
   * Both show a pulsing placeholder until the picture arrives. They assume a
   * `fill` image, which paints over that placeholder.
   */
  load?: "eager" | "near";
};

/**
 * Tiles that fetch at once (load="eager"). This is two rows of the widest
 * grid, and the most a laptop shows above the fold. Every eager tile below
 * the fold takes bandwidth from the ones on screen, so it stays small.
 */
export const EAGER_SCREENSHOT_TILES = 12;

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

/*
 * Object → the signed URL it last loaded under in this tab, oldest first.
 *
 * The API re-signs every screenshot every 100 s (a third of the 300 s TTL).
 * Spaces answers with `Cache-Control: max-age=3600`, so the browser keeps each
 * picture for an hour, but only under the URL it came from. A tile mounted
 * with a new signature for a picture already seen (a tab switch, going back
 * to a date, the lightbox) shows it under the old URL instead. The HTTP cache
 * answers that without the network, while the new URL would download a
 * picture that cannot have changed. If the cache no longer holds it, the
 * request fails like any expired URL and the tile switches to the current one
 * (handleError).
 *
 * Browser only: on the server this module is shared by every request. It is
 * empty when a page hydrates, so server and client render the same src.
 */
const loadedUrls = new Map<string, string>();
const MAX_REMEMBERED = 2000;

const rememberLoaded = (url: Props["src"]) => {
  const object = objectOf(url);
  if (object === null || typeof url !== "string") return;
  loadedUrls.delete(object);
  loadedUrls.set(object, url);
  if (loadedUrls.size > MAX_REMEMBERED) {
    const oldest = loadedUrls.keys().next().value;
    if (oldest !== undefined) loadedUrls.delete(oldest);
  }
};

const forgetLoaded = (url: Props["src"]) => {
  const object = objectOf(url);
  if (object !== null && loadedUrls.get(object) === url) {
    loadedUrls.delete(object);
  }
};

/** The URL this picture already loaded under in this tab, if any. */
const loadedUrlFor = (src: Props["src"]): string | undefined => {
  if (typeof window === "undefined") return undefined;
  const object = objectOf(src);
  return object === null ? undefined : loadedUrls.get(object);
};

/*
 * How far outside the viewport a "near" tile starts its download: about two
 * grid rows of lead while scrolling. The browser's own loading="lazy" reaches
 * ~1250 px, which on a screenshot day put 26 extra full-size downloads beside
 * the 18 tiles on screen, all sharing one connection.
 */
const NEAR_MARGIN = "500px 0px";

let nearObserver: IntersectionObserver | null = null;
const nearCallbacks = new WeakMap<Element, () => void>();

/** Calls `onNear` once `el` is within NEAR_MARGIN; one observer for every tile. */
const whenNear = (el: Element, onNear: () => void): (() => void) => {
  if (typeof IntersectionObserver === "undefined") {
    onNear();
    return () => {};
  }
  nearObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        nearObserver?.unobserve(entry.target);
        nearCallbacks.get(entry.target)?.();
        nearCallbacks.delete(entry.target);
      }
    },
    { rootMargin: NEAR_MARGIN },
  );
  nearCallbacks.set(el, onNear);
  nearObserver.observe(el);
  return () => {
    nearCallbacks.delete(el);
    nearObserver?.unobserve(el);
  };
};

const ScreenshotImage = ({
  src,
  alt,
  className,
  fallbackClassName,
  load,
  ...rest
}: Props) => {
  const router = useRouter();
  const [recovering, setRecovering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  // What the <Image> shows: the `src` prop, or another URL for the same
  // picture that loaded or is loading (see loadedUrls and the src effect).
  const [shownSrc, setShownSrc] = useState<Props["src"]>(
    () => loadedUrlFor(src) ?? src,
  );
  // A "near" tile has no <img> until it nears the viewport, unless the
  // browser already holds the picture: that one costs no download.
  const [near, setNear] = useState(
    () => load !== "near" || loadedUrlFor(src) !== undefined,
  );
  const [loaded, setLoaded] = useState(false);
  const attemptsRef = useRef(0);
  const mountedRef = useRef(true);
  const loadedRef = useRef(false);
  // The URL on screen failed. Until then a re-signed src never replaces it.
  const erroredRef = useRef(false);
  const srcRef = useRef(src);
  const shownRef = useRef(shownSrc);
  const sentinelRef = useRef<HTMLSpanElement>(null);

  srcRef.current = src;
  shownRef.current = shownSrc;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (near) return;
    const el = sentinelRef.current;
    if (!el) return;
    return whenNear(el, () => setNear(true));
  }, [near]);

  useEffect(() => {
    // The same picture under a new signature: keep the URL on screen. Every
    // route re-render re-signs every URL (a live refresh, a revalidating
    // action), and swapping the src made the browser download the picture
    // again, or drop a download under way, for an image that cannot have
    // changed. The kept URL loaded, is loading, or came from loadedUrls; only
    // a failed one gives way. A loaded one stands in for the load the swap
    // would have produced, so it re-arms recovery the same way: a re-signed
    // URL is the proof that refreshes still work.
    const object = objectOf(src);
    if (
      object !== null &&
      object === objectOf(shownRef.current) &&
      !erroredRef.current
    ) {
      if (loadedRef.current) noteScreenshotLoaded();
      return;
    }
    // Another picture, or one whose URL failed: a refresh delivered a newly
    // signed URL, so give it a clean shot. The attempt budget intentionally
    // survives (see MAX_AUTO_RETRIES).
    loadedRef.current = false;
    erroredRef.current = false;
    setLoaded(false);
    setShownSrc(loadedUrlFor(src) ?? src);
    setFailed(false);
    setRecovering(false);
    setRetryNonce(0);
  }, [src]);

  const handleError = () => {
    loadedRef.current = false;
    setLoaded(false);
    forgetLoaded(shownRef.current);
    // A kept URL failed: an older signature that has expired, or one from
    // loadedUrls the HTTP cache no longer holds. The current one is at hand,
    // no recovery needed.
    if (shownRef.current !== srcRef.current) {
      setShownSrc(srcRef.current);
      return;
    }
    erroredRef.current = true;
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
    <>
      {/* Grid tiles only: a still-unloaded tile pulses instead of sitting as
          a flat grey box. The `fill` image after it paints over it as the
          JPEG arrives. The span is also what the near-viewport observer
          watches. */}
      {load && !loaded && (
        <span
          ref={sentinelRef}
          aria-hidden
          className={cn(
            "absolute inset-0 bg-gray-200/70 dark:bg-white/5",
            near && "animate-pulse",
          )}
        />
      )}
      {near && (
        <Image
          key={retryNonce}
          src={shownSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          className={className}
          // A "near" tile renders its <img> only once it is near, so the
          // browser need not wait for layout to decide.
          loading={load ? "eager" : undefined}
          fetchPriority={load === "eager" ? "high" : undefined}
          onLoad={() => {
            loadedRef.current = true;
            erroredRef.current = false;
            attemptsRef.current = 0;
            setLoaded(true);
            rememberLoaded(shownRef.current);
            noteScreenshotLoaded();
          }}
          onError={handleError}
          {...rest}
          // Screenshots go straight from the Spaces CDN to the browser, never
          // via /_next/image. The optimizer's cache key is the whole URL,
          // signature included, and the signature changes every time the URL
          // is re-signed, so it almost never hits. Every grid tile then made
          // the VPS download a 1440px JPEG from Spaces, decode it and
          // re-encode it to WebP. One screenshot day queued dozens of those
          // jobs, the server's worker threads saturated, and the tiles (and
          // every other optimized image) sat pending as grey boxes. Loading
          // the original also puts the exact URL the lightbox opens into the
          // browser cache.
          unoptimized
        />
      )}
    </>
  );
};

export default ScreenshotImage;
