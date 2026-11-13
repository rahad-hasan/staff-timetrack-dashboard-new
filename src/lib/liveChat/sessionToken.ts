/**
 * Per-user Crisp session tokens.
 *
 * Without a token, Crisp keys the conversation on a browser cookie. A
 * colleague who signs in on the same machine after you would then open YOUR
 * conversation. Crisp's documented fix is `CRISP_TOKEN_ID`: a secret,
 * unguessable value unique to each user, which also restores that user's
 * history when they come back.
 *
 * Crisp suggests storing a random UUID per user in the backend. Until the API
 * offers one, the token is a random UUID kept per user in this browser. It
 * restores the conversation across reloads and tabs, and stays through a
 * session that expires and through the same user signing in again, so the
 * thread, and a reply the agent sends to it meanwhile, is still there when
 * they are back.
 *
 * Two things remove a token, because left in localStorage it could be read
 * by the next person at a shared machine and used to resume the conversation:
 * - an explicit sign-out forgets every token (`forgetSessionTokens()`);
 * - a sign-in forgets every OTHER user's (`forgetSessionTokens(userId)`).
 * So after a session that merely expired, the token stays readable in this
 * browser until someone signs in or out here. A server-issued token would
 * close that, follow a user to a second device and survive sign-out; moving
 * to one only means changing where `resolveSessionToken` reads from.
 */

const STORAGE_PREFIX = "live-chat:session-token:";

const storageKey = (userId: number) => `${STORAGE_PREFIX}${userId}`;

/** Fallback when storage is blocked: still isolates users, for this page only. */
const memoryTokens = new Map<number, string>();

export function resolveSessionToken(userId: number): string {
  try {
    const key = storageKey(userId);
    const stored = window.localStorage.getItem(key);
    if (stored) return stored;

    const token = createToken();
    window.localStorage.setItem(key, token);
    return token;
  } catch {
    let token = memoryTokens.get(userId);
    if (!token) memoryTokens.set(userId, (token = createToken()));
    return token;
  }
}

/**
 * Forget the tokens held in this browser: every user's on an explicit
 * sign-out (no argument), every user's but `keepUserId`'s at a sign-in. An id
 * the sign-in response did not carry keeps nothing: with no user to keep it
 * for, every token is somebody else's.
 */
export function forgetSessionTokens(keepUserId?: number | string | null) {
  const keep =
    keepUserId === undefined || keepUserId === null || keepUserId === ""
      ? null
      : String(keepUserId);
  const keepKey = keep === null ? null : `${STORAGE_PREFIX}${keep}`;

  for (const userId of [...memoryTokens.keys()]) {
    if (String(userId) !== keep) memoryTokens.delete(userId);
  }
  try {
    const storage = window.localStorage;
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(STORAGE_PREFIX) && key !== keepKey) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  } catch {
    // Storage blocked: the in-memory fallback above held the only copies.
  }
}

/** UUID v4. `randomUUID` exists only in secure contexts; `getRandomValues` everywhere. */
function createToken(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4),
    hex.slice(4, 6),
    hex.slice(6, 8),
    hex.slice(8, 10),
    hex.slice(10, 16),
  ]
    .map((group) => group.join(""))
    .join("-");
}
