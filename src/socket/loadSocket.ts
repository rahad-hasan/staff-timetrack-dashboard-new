/**
 * The realtime client (./socket: socket.io-client and its transports), loaded
 * on demand for the signed-in shell.
 *
 * The shell needs it for two things, neither of which is on screen in the
 * first frame: the connection itself (SocketProvider) and the notification
 * feed behind the header's bell. Imported statically from those, the client
 * was part of the JavaScript every signed-in page had to download and run
 * before it could hydrate. Both now ask for it from an effect, so it arrives
 * right after the page is interactive.
 *
 * - One shared promise: the header subscribes in a child effect, which runs
 *   before the provider's, so its listener is registered before the provider
 *   connects — the first `notifications` event cannot be missed. (It could
 *   not in any case: the handshake is asynchronous.)
 * - Pages that use the socket themselves (support tickets, the refunds tab)
 *   keep importing ./socket directly. It is the same module instance, so
 *   there is still exactly one connection.
 * - A chunk that will not load is retried a few times and then given up on
 *   until the next call. Never `loadOrReload` here: realtime updates are an
 *   extra, and reloading the page for them could discard a half-filled form.
 *   The live-refresh build check already asks an out-of-date tab to reload.
 */
type SocketModule = typeof import("./socket");

/** Waits before the second and third attempt. */
const RETRY_DELAYS_MS = [2_000, 10_000];

let loading: Promise<SocketModule> | null = null;

function attempt(index: number): Promise<SocketModule> {
  return import("./socket").catch((error: unknown) => {
    const delay = RETRY_DELAYS_MS[index];
    if (delay === undefined) throw error;
    return new Promise<void>((resolve) => setTimeout(resolve, delay)).then(
      () => attempt(index + 1),
    );
  });
}

export function loadSocket(): Promise<SocketModule> {
  loading ??= attempt(0).catch((error: unknown) => {
    // Forget the failure, so a later mount or session change tries again.
    loading = null;
    throw error;
  });
  return loading;
}
