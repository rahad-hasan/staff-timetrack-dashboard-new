"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { newIdempotencyKey } from "@/lib/support";

/**
 * `run(fn)` aborts the previous in-flight call before starting the next one
 * and aborts the last one on unmount — for searches, filter changes, page
 * changes and socket-driven refetches. The callback receives the signal to
 * hand to `supportApi.*({ signal })`; an aborted call resolves to the
 * `{ ok: false, aborted: true }` result, which callers ignore.
 *
 *   const latest = useLatestRequest();
 *   const result = await latest.run((signal) => supportApi.listTickets(filters, { signal }));
 *   if (!result.ok && result.aborted) return; // superseded — not an error
 */
export function useLatestRequest() {
  const controllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const run = useCallback(<T,>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return fn(controller.signal).finally(() => {
      if (controllerRef.current === controller) controllerRef.current = null;
    });
  }, []);

  useEffect(() => abort, [abort]);

  // Stable for the component's life: callers may depend on the object itself.
  return useMemo(() => ({ run, abort }), [run, abort]);
}

/**
 * One `Idempotency-Key` per SUBMISSION (§8.1, §17.2 item 8): the same key
 * for every retry of an identical body (the server replays the first
 * answer), a fresh key as soon as the body changes (the server answers 422
 * IDEMPOTENCY_KEY_REUSED to a reused key with a different body), and a
 * fresh key after `reset()` (call it once the submission succeeded).
 *
 *   const idem = useIdempotencyKey();
 *   const key = idem.keyFor(payload);
 *   const result = await supportApi.createTicket(payload, { idempotencyKey: key });
 *   if (result.ok) idem.reset();
 */
export function useIdempotencyKey() {
  const stateRef = useRef<{ fingerprint: string; key: string } | null>(null);

  const keyFor = useCallback((body: unknown): string => {
    let fingerprint: string;
    try {
      fingerprint = JSON.stringify(body) ?? "";
    } catch {
      fingerprint = String(Math.random());
    }
    const current = stateRef.current;
    if (current && current.fingerprint === fingerprint) return current.key;
    const key = newIdempotencyKey();
    stateRef.current = { fingerprint, key };
    return key;
  }, []);

  const reset = useCallback(() => {
    stateRef.current = null;
  }, []);

  return useMemo(() => ({ keyFor, reset }), [keyFor, reset]);
}
