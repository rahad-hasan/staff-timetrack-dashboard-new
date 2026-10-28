"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * A ref that always holds the latest `value`, written after render (never during it) — for
 * reading the current props / state from socket handlers, timers and other async callbacks
 * without re-creating them.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
