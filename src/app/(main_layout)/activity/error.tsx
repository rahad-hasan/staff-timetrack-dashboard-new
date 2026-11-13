"use client";

import AutoRecoveringError from "@/components/Common/AutoRecoveringError";

/**
 * Activity pages refresh themselves in the background, so a failed read must
 * heal itself rather than latch the page (see useErrorAutoRecovery).
 */
export default function ActivityError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AutoRecoveringError reset={reset} />;
}
