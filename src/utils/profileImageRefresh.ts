"use client";

import { getMyProfile } from "@/actions/auth/action";
import { isRenderableImageSrc } from "./imageSrc";

export type TProfileImageRefresh =
  | { status: "ok"; image: string | null }
  | { status: "skipped" }
  | { status: "failed" };

// The header avatar, the sidebar popover avatar and the settings avatar all
// re-sign through here, so one expiry episode costs a single API read instead
// of one per mounted avatar.
let inflight: Promise<TProfileImageRefresh> | null = null;
let lastFinishedAt = 0;
let consecutiveFailures = 0;

const COOLDOWN_MS = 10_000;

// A failing profile read (offline, 403 from the subscription gate) must not
// turn into a request loop; after this many in a row the avatar simply keeps
// its fallback until something else re-arms it.
const MAX_CONSECUTIVE_FAILURES = 3;

export function resetProfileImageRefresh() {
  consecutiveFailures = 0;
  lastFinishedAt = 0;
}

async function readProfileImage(): Promise<TProfileImageRefresh> {
  try {
    const res = await getMyProfile();

    if (!res?.success) {
      consecutiveFailures += 1;
      return { status: "failed" };
    }

    consecutiveFailures = 0;

    const image = res?.data?.image;

    // A user with no photo is a successful read, not a failure — report null
    // so callers stamp the sync time and stop asking.
    return { status: "ok", image: isRenderableImageSrc(image) ? image : null };
  } catch {
    consecutiveFailures += 1;
    return { status: "failed" };
  }
}

/**
 * `force` is for callers that just changed the photo. It skips the cooldown
 * and the failure cap, and deliberately does not join an in-flight read —
 * that read may have been issued before the upload landed and would answer
 * with the previous image.
 */
export function refreshProfileImage(
  { force = false }: { force?: boolean } = {},
): Promise<TProfileImageRefresh> {
  if (force) {
    return readProfileImage().finally(() => {
      lastFinishedAt = Date.now();
    });
  }

  if (inflight) return inflight;

  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    return Promise.resolve({ status: "skipped" });
  }

  if (Date.now() - lastFinishedAt < COOLDOWN_MS) {
    return Promise.resolve({ status: "skipped" });
  }

  inflight = readProfileImage().finally(() => {
    inflight = null;
    lastFinishedAt = Date.now();
  });

  return inflight;
}
