"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLatestRef } from "@/components/Support/primitives/useLatestRef";
import { supportApi } from "@/lib/support";
import { attachmentDtoHref, attachmentKeyFromUrl } from "@/lib/supportAttachments";
import type { AttachmentDTO } from "@/types/support";

/**
 * Signed download URLs expire (AttachmentDTO.download_url: 15 min signed,
 * `expires_in` = the validity the server still guarantees, 600 s for a page
 * URL served from its cache). Every file on the page is rendered with the
 * URL it came with; a click or a broken thumbnail after the URL went stale
 * re-signs that ONE file through the v1 alias `GET /tickets/attachments/url
 * ?key=` (the object key is the path of the signed URL; the API checks the
 * caller may see it) instead of refetching the whole ticket. A file whose
 * URL could not be signed at all (`download_url: null`) asks the page to
 * refetch the ticket, which re-signs every file.
 */

/** Re-sign this long before the claimed expiry (clock skew, slow clicks). */
const SAFETY_MARGIN_MS = 60_000;
/** Assumed validity when a payload carries no `expires_in` (socket copies). */
const DEFAULT_VALIDITY_S = 600;

interface Signed {
  url: string;
  until: number;
}

export interface AttachmentUrlResolver {
  /** best URL to render right now (a re-signed one once it exists), or null */
  hrefFor: (file: AttachmentDTO, obtainedAt?: number) => string | null;
  /** a URL that is valid for at least the safety margin, re-signing when needed */
  ensureFresh: (file: AttachmentDTO, obtainedAt: number) => Promise<string | null>;
  /** a thumbnail failed to load: re-sign once; resolves to the new URL (or null) */
  recover: (file: AttachmentDTO) => Promise<string | null>;
  /** bumps whenever a URL was re-signed, so <img> consumers re-render */
  version: number;
}

const AttachmentUrlContext = createContext<AttachmentUrlResolver | null>(null);

const expiryOf = (file: AttachmentDTO, obtainedAt: number) =>
  obtainedAt + (file.expires_in ?? DEFAULT_VALIDITY_S) * 1000 - SAFETY_MARGIN_MS;

export function AttachmentUrlProvider({
  children,
  onUnsignable,
}: {
  children: ReactNode;
  /** no URL and no key to re-sign with — the page refetches the ticket */
  onUnsignable: () => void;
}) {
  const cacheRef = useRef(new Map<number, Signed>());
  const inflightRef = useRef(new Map<number, Promise<string | null>>());
  const failedRef = useRef(new Set<number>());
  const [version, setVersion] = useState(0);
  const unsignableRef = useLatestRef(onUnsignable);

  const resign = useCallback((file: AttachmentDTO): Promise<string | null> => {
    const running = inflightRef.current.get(file.id);
    if (running) return running;
    const key = file.download_url ? attachmentKeyFromUrl(file.download_url) : null;
    if (!key) {
      unsignableRef.current();
      return Promise.resolve(null);
    }
    const promise = supportApi
      .getAttachmentUrl(key, { noSessionRedirect: false })
      .then((result) => {
        if (!result.ok) return null;
        cacheRef.current.set(file.id, {
          url: result.data.url,
          until: Date.now() + result.data.expires_in * 1000 - SAFETY_MARGIN_MS,
        });
        setVersion((v) => v + 1);
        return result.data.url;
      })
      .finally(() => {
        inflightRef.current.delete(file.id);
      });
    inflightRef.current.set(file.id, promise);
    return promise;
  }, [unsignableRef]);

  // A re-signed URL wins only while it outlives the one the payload carries: a later
  // refetch brings fresh signatures, and those must not be shadowed by an older re-sign.
  const hrefFor = useCallback((file: AttachmentDTO, obtainedAt?: number) => {
    const cached = cacheRef.current.get(file.id);
    const original = attachmentDtoHref(file);
    if (!cached) return original;
    if (!original || obtainedAt === undefined) return cached.url;
    return cached.until >= expiryOf(file, obtainedAt) ? cached.url : original;
  }, []);

  const ensureFresh = useCallback(
    async (file: AttachmentDTO, obtainedAt: number) => {
      const now = Date.now();
      const cached = cacheRef.current.get(file.id);
      const original = attachmentDtoHref(file);
      const originalUntil = original ? expiryOf(file, obtainedAt) : Number.NEGATIVE_INFINITY;
      if (cached && cached.until > now && cached.until >= originalUntil) return cached.url;
      if (original && originalUntil > now) return original;
      if (cached && cached.until > now) return cached.url;
      return resign(file);
    },
    [resign],
  );

  const recover = useCallback(
    async (file: AttachmentDTO) => {
      // one re-sign per file per page view: a URL that fails right after a
      // fresh signature is a missing object, not an expired link
      if (failedRef.current.has(file.id)) return null;
      failedRef.current.add(file.id);
      return resign(file);
    },
    [resign],
  );

  const value = useMemo<AttachmentUrlResolver>(
    () => ({ hrefFor, ensureFresh, recover, version }),
    [hrefFor, ensureFresh, recover, version],
  );

  return <AttachmentUrlContext.Provider value={value}>{children}</AttachmentUrlContext.Provider>;
}

export const useAttachmentUrls = (): AttachmentUrlResolver => {
  const context = useContext(AttachmentUrlContext);
  if (!context) throw new Error("useAttachmentUrls must be used inside <AttachmentUrlProvider>");
  return context;
};

/**
 * Starts a download from a (fresh) signed URL. The URL carries
 * `response-content-disposition=attachment`, so navigating the current tab
 * to it downloads without leaving the page — and unlike `window.open` after
 * an await it is never caught by a pop-up blocker.
 */
export const startDownload = (url: string) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};
