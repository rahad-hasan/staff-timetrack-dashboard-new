"use client";

import { readLiveJson } from "@/lib/readLiveJson";
import { isRenderableImageSrc } from "./imageSrc";

export type TProfileImageRefresh =
  /**
   * `phone` rides along because this read is the only one that returns it:
   * the live session the layout hands to `SessionSync` carries no phone, and
   * the profile form is seeded from the store. Undefined when the response
   * left the field out, so a caller never blanks a phone it was not sent.
   * `userId` is the account the server answered for (the record's own id).
   */
  | {
      status: "ok";
      userId?: number;
      image: string | null;
      phone?: string | null;
    }
  | { status: "skipped" }
  | { status: "failed" };

/** Served by src/app/api/profile/route.ts. */
const PROFILE_URL = "/api/profile";

interface ProfileRead {
  answer: Promise<TProfileImageRefresh>;
  /** Cancels the read: its callers get `successor`'s answer, or "skipped". */
  cancel: (successor?: Promise<TProfileImageRefresh>) => void;
}

// The header avatar, the sidebar popover avatar and the settings avatar all
// re-sign through here, so one expiry episode costs a single API read instead
// of one per mounted avatar.
//
// Only the newest read may answer. These reads are plain GETs, so nothing
// orders them after the profile's writes (server actions): one sent before a
// photo upload or a profile save can answer after it, with what it replaced.
let inflight: ProfileRead | null = null;
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
  // The session that asked has ended (sign-out, another account signed in):
  // its read is cancelled, and an answer already received is dropped.
  inflight?.cancel();
  inflight = null;
}

async function readProfileImage(
  signal: AbortSignal,
): Promise<TProfileImageRefresh> {
  const res = await readLiveJson<{
    id?: number;
    image?: string | null;
    phone?: string | null;
  }>(PROFILE_URL, { signal });

  // Cancelled (a newer read replaced it, or its session ended): the answer is
  // nobody's, and must not touch the cooldown or failure count either.
  if (signal.aborted) return { status: "skipped" };
  lastFinishedAt = Date.now();

  if (!res?.success) {
    consecutiveFailures += 1;
    return { status: "failed" };
  }

  consecutiveFailures = 0;

  const image = res.data?.image;
  const phone = res.data?.phone;

  // A user with no photo is a successful read, not a failure — report null
  // so callers stamp the sync time and stop asking.
  return {
    status: "ok",
    userId: res.data?.id,
    image: isRenderableImageSrc(image) ? image : null,
    phone:
      phone === undefined
        ? undefined
        : typeof phone === "string" && phone
          ? phone
          : null,
  };
}

/**
 * Sends a read that takes over from the one in flight. That one was sent
 * before whatever called for this one (a photo upload, a profile save) and
 * may answer with what it replaced, so it is cancelled, and whoever waits on
 * it gets this read's answer instead.
 */
function startRead(): Promise<TProfileImageRefresh> {
  const controller = new AbortController();
  let successor: Promise<TProfileImageRefresh> | undefined;
  const answer = readProfileImage(controller.signal)
    .then((result) => successor ?? result)
    .finally(() => {
      // Only this read's own slot: a newer read or a reset may hold it now.
      if (inflight?.answer === answer) inflight = null;
    });
  inflight?.cancel(answer);
  inflight = {
    answer,
    cancel: (next) => {
      successor = next;
      controller.abort();
    },
  };
  return answer;
}

/**
 * `force` is for callers that just changed the photo. It skips the cooldown
 * and the failure cap, and replaces an in-flight read instead of joining it —
 * that read may have been sent before the upload landed and would answer
 * with the previous image.
 */
export function refreshProfileImage(
  { force = false }: { force?: boolean } = {},
): Promise<TProfileImageRefresh> {
  if (force) return startRead();

  if (inflight) return inflight.answer;

  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    return Promise.resolve({ status: "skipped" });
  }

  if (Date.now() - lastFinishedAt < COOLDOWN_MS) {
    return Promise.resolve({ status: "skipped" });
  }

  return startRead();
}

/**
 * For callers that just saved the profile (name, phone): a read in flight was
 * sent before the save and may answer with the old phone — which the profile
 * form, showing the store, would then save back. It is sent again.
 */
export function markProfileChanged() {
  if (inflight) void startRead();
}
