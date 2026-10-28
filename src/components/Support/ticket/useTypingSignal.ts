"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLatestRef } from "@/components/Support/primitives/useLatestRef";

/** a start is repeated this often while typing goes on — the console clears its line 4 s after the last one */
const REPEAT_START_MS = 2_500;
/** no keystroke for this long ends the signal */
const IDLE_STOP_MS = 3_000;

/**
 * The requester's typing signal (`ticket:typing`, step-5 client contract): drives the console's
 * "<requester> is typing" line. One start when typing begins, repeated every 2.5 s while it goes
 * on (well above the server's 1 / 500 ms start throttle), and one stop after 3 s without a
 * keystroke, on blur, when the text is emptied, when a send starts and on unmount — never a stop
 * without a start. `emit` may be undefined (no namespace): every call is then a no-op.
 */
export function useTypingSignal(emit: ((isTyping: boolean) => void) | undefined) {
  const emitRef = useLatestRef(emit);
  const typingRef = useRef(false);
  const lastStartRef = useRef(0);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = null;
    if (!typingRef.current) return;
    typingRef.current = false;
    emitRef.current?.(false);
  }, [emitRef]);

  const input = useCallback(
    (text: string) => {
      if (!emitRef.current) return;
      if (text.trim().length === 0) {
        stop();
        return;
      }
      const now = Date.now();
      if (!typingRef.current || now - lastStartRef.current >= REPEAT_START_MS) {
        typingRef.current = true;
        lastStartRef.current = now;
        emitRef.current(true);
      }
      if (idleRef.current) clearTimeout(idleRef.current);
      idleRef.current = setTimeout(stop, IDLE_STOP_MS);
    },
    [emitRef, stop],
  );

  useEffect(() => stop, [stop]);

  return useMemo(() => ({ input, stop }), [input, stop]);
}
