"use client";

import { useCallback, useEffect, useRef } from "react";
import { useLogInUserStore } from "@/store/logInUserStore";
import { isRenderableImageSrc } from "@/utils/imageSrc";
import { refreshProfileImage } from "@/utils/profileImageRefresh";

// Signed asset URLs are valid for ~30 minutes server-side, but the store is
// persisted to localStorage indefinitely — re-sign comfortably before the TTL
// so a restored session never paints an already-dead URL.
const STALE_AFTER_MS = 20 * 60 * 1000;

// Cap on error-driven re-signs per mount, so an image that is signed fine but
// missing from the bucket can't ping-pong between error and refresh.
const MAX_ERROR_RECOVERIES = 2;

type TAvatarLoadingStatus = "idle" | "loading" | "loaded" | "error";

/**
 * Single source of truth for the logged-in user's avatar URL.
 *
 * Keeps three failure modes off the screen: a raw bucket key written by the
 * upload response, a signed URL that expired while the tab was open, and a
 * stale URL restored from localStorage on a later visit.
 */
export const useProfileImage = () => {
  const logInUserData = useLogInUserStore((state) => state.logInUserData);
  const updateUserData = useLogInUserStore((state) => state.updateUserData);

  const image = logInUserData?.image;
  const imageSyncedAt = logInUserData?.imageSyncedAt;
  const hasSession = Boolean(logInUserData?.id);

  const src = isRenderableImageSrc(image) ? image : undefined;

  const errorRecoveriesRef = useRef(0);

  const sync = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      const result = await refreshProfileImage({ force });

      if (result.status !== "ok") return false;

      // Stamp the sync time even when the user has no photo, otherwise the
      // "needs syncing" check below stays true forever and re-reads on every
      // mount.
      updateUserData({
        image: result.image,
        imageSyncedAt: Date.now(),
      });

      return true;
    },
    [updateUserData],
  );

  // Proactive: repair whatever the store was rehydrated with.
  useEffect(() => {
    if (!hasSession) return;

    const isStale =
      typeof imageSyncedAt !== "number" ||
      Date.now() - imageSyncedAt > STALE_AFTER_MS;

    // An unrenderable non-empty value means a raw storage key slipped into the
    // store and must be exchanged for a signed URL.
    const isUnusable = image != null && !isRenderableImageSrc(image);

    if (!isStale && !isUnusable) return;

    void sync();
  }, [hasSession, image, imageSyncedAt, sync]);

  // Reactive: the URL was renderable but the CDN rejected it (expired
  // signature, rotated object).
  const handleImageError = useCallback(() => {
    if (!hasSession) return;
    if (errorRecoveriesRef.current >= MAX_ERROR_RECOVERIES) return;

    errorRecoveriesRef.current += 1;
    void sync();
  }, [hasSession, sync]);

  // Radix's <AvatarImage> only mounts the <img> once its own probe has
  // loaded, so an onError handler there would never fire — it reports
  // failures through this callback instead.
  const handleLoadingStatusChange = useCallback(
    (status: TAvatarLoadingStatus) => {
      if (status !== "error") return;
      // Radix also reports "error" for an empty src, which just means the
      // user has no photo rather than a URL that died.
      if (!src) return;

      handleImageError();
    },
    [src, handleImageError],
  );

  return { src, handleImageError, handleLoadingStatusChange, sync };
};
