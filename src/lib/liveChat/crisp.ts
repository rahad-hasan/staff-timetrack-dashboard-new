/**
 * A typed, SSR-safe facade over Crisp's `window.$crisp` command queue, and the
 * only module allowed to touch Crisp's globals.
 *
 * Crisp ships no types. Until its loader runs, `$crisp` is a plain array that
 * buffers commands; afterwards it is the real SDK. Without this module every
 * call site would be an untyped `window.$crisp.push([...])` with its own
 * `typeof window` guard.
 *
 * It is also the containment boundary for a third-party script running inside
 * the authenticated app: Crisp loads only once the page is idle, and nothing
 * Crisp throws can escape into React.
 *
 * It also absorbs three behaviours of the SDK that are wrong for an SPA. Each
 * was confirmed against Crisp's shipped client (v4.18), not just the docs:
 *
 *  1. Events have ONE subscriber. `["on", event, fn]` overwrites the previous
 *     handler, so a second component listening to `chat:closed` would silently
 *     unhook the first. One forwarder is bound per event and fans out to any
 *     number of listeners here.
 *  2. `session:reset` re-runs the loader, which forgets those bindings. They
 *     are re-applied from `CRISP_READY_TRIGGER`, which fires on every (re)load.
 *  3. The script outlives the React tree whenever the signed-in shell is left
 *     without a page load (a session expiry lands on /session-expired
 *     client-side). Switching users therefore swaps `CRISP_TOKEN_ID` and
 *     resets, which is the sequence Crisp documents, instead of injecting the
 *     script a second time.
 */

/** Where Crisp's loader and client bundle are served from. */
export const CRISP_ORIGIN = "https://client.crisp.chat";
const LOADER_SRC = `${CRISP_ORIGIN}/l.js`;
const LOADER_ID = "crisp-loader";

/* ───────────────────────────── types ───────────────────────────── */

/** Arguments Crisp passes to each event handler. */
export interface CrispEventArgs {
  "session:loaded": [sessionId: string];
  "chat:opened": [];
  "chat:closed": [];
  "message:received": [message: unknown];
}

export type CrispEvent = keyof CrispEventArgs;

const CRISP_EVENTS = [
  "session:loaded",
  "chat:opened",
  "chat:closed",
  "message:received",
] as const satisfies readonly CrispEvent[];

type CrispAction =
  | "chat:open"
  | "chat:close"
  | "chat:show"
  | "chat:hide"
  | "session:reset";

/** `["set", key, args]`: Crisp validates these and throws on bad input. */
interface CrispSetters {
  "user:email": [email: string];
  "user:nickname": [nickname: string];
  "user:company": [name: string];
  "session:data": [data: [key: string, value: string | number | boolean][]];
  "session:segments": [segments: string[]];
}

interface CrispConfigs {
  "color:mode": [mode: "light" | "dark" | "auto"];
}

type CrispState = "chat:opened";

type CrispCommand = [string, ...unknown[]];

/** What `window.$crisp` becomes once the loader has run. */
interface CrispSdk {
  push(command: CrispCommand): void;
  is(state: string): boolean;
  get(key: string): unknown;
}

declare global {
  interface Window {
    $crisp?: CrispSdk | CrispCommand[];
    CRISP_WEBSITE_ID?: string;
    CRISP_TOKEN_ID?: string | null;
    CRISP_RUNTIME_CONFIG?: { locale?: string };
    CRISP_READY_TRIGGER?: () => void;
  }
}

/* ───────────────────────────── state ───────────────────────────── */

type Listener = (...args: never[]) => void;

const eventListeners = new Map<CrispEvent, Set<Listener>>();
const readyListeners = new Set<() => void>();

/**
 * The token the page's Crisp instance is bound to. `undefined` means the
 * script has not been injected on this page yet. `null` means it is loaded
 * but bound to no one, which is the state after sign-out.
 */
let boundToken: string | null | undefined;
let pendingShutdown: ReturnType<typeof setTimeout> | null = null;
/** Set only while the loader is waiting for the page to go idle. */
let cancelLoaderInjection: (() => void) | null = null;

/* ──────────────────────────── commands ──────────────────────────── */

const isBrowser = () => typeof window !== "undefined";

function push(command: CrispCommand) {
  if (!isBrowser()) return;
  try {
    (window.$crisp ??= []).push(command);
  } catch (error) {
    // Once loaded, Crisp runs commands synchronously, so a fault in it would
    // throw into our effects and click handlers. A support widget must never
    // take the page down with it. Only the command's name is logged: its
    // arguments can be personal data.
    console.error(
      `[live-chat] Crisp rejected "${command[0]} ${String(command[1] ?? "")}"`,
      error,
    );
  }
}

/** The loaded SDK, or `null` while `$crisp` is still the pre-load queue. */
function sdk(): CrispSdk | null {
  const crisp = isBrowser() ? window.$crisp : undefined;
  return crisp && typeof (crisp as CrispSdk).is === "function"
    ? (crisp as CrispSdk)
    : null;
}

export function crispDo(action: CrispAction) {
  push(["do", action]);
}

export function crispSet<K extends keyof CrispSetters>(
  key: K,
  ...args: CrispSetters[K]
) {
  push(["set", key, args]);
}

export function crispConfig<K extends keyof CrispConfigs>(
  key: K,
  ...args: CrispConfigs[K]
) {
  push(["config", key, args]);
}

/** Reads are synchronous and only meaningful once loaded; before that, `false`. */
export function crispIs(state: CrispState): boolean {
  try {
    return sdk()?.is(state) === true;
  } catch {
    return false;
  }
}

export function crispUnreadCount(): number {
  try {
    const count = Number(sdk()?.get("chat:unread:count"));
    return Number.isFinite(count) && count > 0 ? count : 0;
  } catch {
    return 0;
  }
}

/* ───────────────────────────── events ───────────────────────────── */

function notify<T extends unknown[]>(
  listeners: Iterable<(...args: T) => void> | undefined,
  args: T,
) {
  if (!listeners) return;
  for (const listener of listeners) {
    // One broken listener must not starve the rest. It is still reported.
    try {
      listener(...args);
    } catch (error) {
      console.error("[live-chat] listener failed", error);
    }
  }
}

/** Subscribe to a Crisp event. Returns the unsubscribe function. */
export function onCrispEvent<E extends CrispEvent>(
  event: E,
  listener: (...args: CrispEventArgs[E]) => void,
): () => void {
  let listeners = eventListeners.get(event);
  if (!listeners) eventListeners.set(event, (listeners = new Set()));
  listeners.add(listener as Listener);
  return () => listeners.delete(listener as Listener);
}

/**
 * Fires every time Crisp finishes (re)loading. A `session:reset` counts as a
 * reload, so this is where per-session state has to be re-applied.
 */
export function onCrispReady(listener: () => void): () => void {
  readyListeners.add(listener);
  return () => readyListeners.delete(listener);
}

function handleReady() {
  for (const event of CRISP_EVENTS) {
    push([
      "on",
      event,
      (...args: unknown[]) =>
        notify(eventListeners.get(event) as Set<(...a: unknown[]) => void>, args),
    ]);
  }
  notify(readyListeners, []);
}

/* ──────────────────────────── lifecycle ──────────────────────────── */

/**
 * Every dashboard view pays for Crisp's bundle and socket, and none of it is
 * needed to render the page. So the loader waits for the window `load` event
 * and then an idle main thread: the same rule as Next's `lazyOnload` script
 * strategy. Crisp never competes with hydration or with the page's own
 * requests. The cap stops one slow image from holding the chat back forever.
 */
const MAX_WAIT_FOR_LOAD_MS = 10_000;
const IDLE_TIMEOUT_MS = 3_000;

/** Runs `task` once the page has loaded and gone idle. Returns a canceller. */
function whenPageIsIdle(task: () => void): () => void {
  let cancel = () => {};

  const runWhenIdle = () => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(task, { timeout: IDLE_TIMEOUT_MS });
      cancel = () => window.cancelIdleCallback(id);
    } else {
      // Safari has no requestIdleCallback; after `load` is quiet enough.
      const id = setTimeout(task, 1);
      cancel = () => clearTimeout(id);
    }
  };

  if (document.readyState === "complete") {
    runWhenIdle();
  } else {
    const stopWaiting = () => {
      window.removeEventListener("load", onLoad);
      clearTimeout(cap);
    };
    const onLoad = () => {
      stopWaiting();
      runWhenIdle();
    };
    const cap = setTimeout(onLoad, MAX_WAIT_FOR_LOAD_MS);
    window.addEventListener("load", onLoad);
    cancel = stopWaiting;
  }

  return () => cancel();
}

function injectLoader() {
  const script = document.createElement("script");
  script.id = LOADER_ID;
  script.src = LOADER_SRC;
  script.async = true;
  // Content blockers routinely drop Crisp. Forget the attempt, queue
  // included, so a later boot (the next visit to the dashboard) starts clean
  // instead of waiting forever on a load that will never fire.
  script.onerror = () => {
    script.remove();
    window.$crisp = [];
    boundToken = undefined;
  };
  document.head.appendChild(script);
}

export interface CrispBootOptions {
  websiteId: string;
  /** Binds the conversation to one user; see `sessionToken.ts`. */
  tokenId: string;
  locale: string;
}

/**
 * Load Crisp for a user, or rebind the already-loaded instance to them.
 * Idempotent: calling it again for the same user is a no-op apart from
 * re-notifying ready listeners, so a remounted tree re-syncs.
 */
export function bootCrisp({ websiteId, tokenId, locale }: CrispBootOptions) {
  if (!isBrowser()) return;

  if (pendingShutdown) {
    clearTimeout(pendingShutdown);
    pendingShutdown = null;
  }

  if (boundToken === tokenId) {
    // A remount for the same user. A loaded Crisp re-syncs whoever just
    // subscribed; one still loading will fire its ready trigger anyway.
    if (sdk()) handleReady();
    return;
  }

  if (boundToken !== undefined) {
    // Crisp reads the token only when it loads. Before the loader is even
    // injected, swapping the global is the whole rebind; after that,
    // `session:reset` makes Crisp load again with it.
    window.CRISP_TOKEN_ID = boundToken = tokenId;
    if (!cancelLoaderInjection) crispDo("session:reset");
    return;
  }

  boundToken = tokenId;
  window.CRISP_WEBSITE_ID = websiteId;
  window.CRISP_TOKEN_ID = tokenId;
  window.CRISP_RUNTIME_CONFIG = { ...window.CRISP_RUNTIME_CONFIG, locale };
  window.CRISP_READY_TRIGGER = handleReady;

  // Buffered until the SDK loads, then replayed in order. "safe" turns a bad
  // value (say, an email Crisp's validator rejects) into a no-op instead of
  // an uncaught throw from inside Crisp.
  push(["safe", true]);
  crispDo("chat:hide");

  cancelLoaderInjection = whenPageIsIdle(() => {
    cancelLoaderInjection = null;
    injectLoader();
  });
}

/**
 * Unbind the conversation from the current user: what Crisp requires on
 * sign-out so the next person on this browser cannot read it. Nothing is
 * deleted on Crisp's side; the user's token restores it when they come back,
 * until an explicit sign-out, or another user's sign-in, forgets the token
 * (see `sessionToken.ts`).
 *
 * Deferred one tick because React StrictMode (and any fast unmount→remount)
 * tears the tree down and straight back up. Resetting in between would
 * reload Crisp for nothing. `bootCrisp` cancels a pending shutdown.
 */
export function shutdownCrisp() {
  if (!isBrowser() || boundToken === undefined) return;
  if (pendingShutdown) clearTimeout(pendingShutdown);

  pendingShutdown = setTimeout(() => {
    pendingShutdown = null;

    if (cancelLoaderInjection) {
      // Signed out before Crisp ever loaded: call the load off instead of
      // queueing commands for an SDK nobody needs any more, and drop the
      // token so it does not linger on the signed-out page.
      cancelLoaderInjection();
      cancelLoaderInjection = null;
      window.$crisp = [];
      window.CRISP_TOKEN_ID = null;
      boundToken = undefined;
      return;
    }

    crispDo("chat:close");
    crispDo("chat:hide");
    if (boundToken === null) return;
    window.CRISP_TOKEN_ID = boundToken = null;
    crispDo("session:reset");
  }, 0);
}
