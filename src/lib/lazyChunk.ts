/**
 * Lazy-chunk loading that survives a deploy.
 *
 * A deploy replaces every chunk while a tab opened before it still asks for
 * the old file names, so the first open of a lazily loaded dialog in such a
 * tab fails with a ChunkLoadError — and, with nothing above it catching the
 * render error, takes the route down with it. `loadOrReload` turns that
 * failure into one reload onto the new build (the caller's loading state stays
 * up meanwhile); a failure again right after that reload is a real fault and
 * is thrown.
 *
 * Use it for the loader handed to `next/dynamic`, as a NAMED constant:
 * Next's compile step rewrites `dynamic(f(...))` into `dynamic(() => f(...))`,
 * which would pass a function where a promise is expected; an identifier is
 * left alone. Preloads (hover/focus warm-ups) must call the RAW import with a
 * `.catch`, never this wrapper — a warm-up must not reload the page.
 */

/** sessionStorage: when this tab last reloaded over a failed chunk (epoch ms). */
const CHUNK_RELOAD_KEY = "stafftime-chunk-reload";
/**
 * A failure this soon after that reload means the reload did not help: the
 * chunk is broken on the new build too, so throw instead of reloading in a
 * loop. Long enough for the reloaded page to boot and the user to reopen what
 * failed; short enough that the next deploy — hours later in the same tab —
 * still gets its one reload. (The mark used to be a bare flag that only a
 * successful lazy load cleared, so after one reload it usually stayed set for
 * the tab's whole life, and the next deploy's failure crashed the page.)
 */
const RELOAD_LOOP_WINDOW_MS = 60_000;

export const loadOrReload =
  <T,>(load: () => Promise<T>) =>
  (): Promise<T> =>
    load().then(
      (module) => {
        try {
          sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        } catch {
          // storage blocked (or no window during a server render) — nothing to clear
        }
        return module;
      },
      (error: unknown) => {
        try {
          // A legacy "1" reads as epoch 1, long expired — it reloads, as it should.
          const sinceReload = Date.now() - Number(sessionStorage.getItem(CHUNK_RELOAD_KEY));
          const justReloaded = sinceReload >= 0 && sinceReload < RELOAD_LOOP_WINDOW_MS;
          if (!justReloaded) {
            sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
            window.location.reload();
            return new Promise<T>(() => {});
          }
        } catch {
          // storage blocked — no loop guard, so surface the error instead
        }
        throw error;
      },
    );
