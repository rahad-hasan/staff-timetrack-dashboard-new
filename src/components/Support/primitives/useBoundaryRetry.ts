"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * "Try again" of the support error boundaries (`error.tsx`):
 * - a server-render failure (the error carries a `digest`) reloads the URL — after a failed FIRST
 *   load Next 15's `router.refresh()` + `reset()` never re-renders the segment (seen live on the
 *   ticket page: the RSC refresh answers 200, then React #310 inside Next's Router);
 * - a client render error re-runs the segment in one transition, so the button spins until fresh
 *   data has rendered.
 * The error is logged in development only (production reports it through the digest).
 */
export function useBoundaryRetry(error: Error & { digest?: string }, reset: () => void, label: string) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error(`[support] ${label} failed`, error);
  }, [error, label]);

  const retry = () => {
    if (error.digest) {
      setReloading(true);
      window.location.reload();
      return;
    }
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return { retry, busy: retrying || reloading };
}
