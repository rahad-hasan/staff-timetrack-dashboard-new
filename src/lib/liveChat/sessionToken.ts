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
 * offers one, the token is a random UUID kept per user in this browser. That
 * still separates every account on a shared machine. What it cannot give is
 * history that follows a user to a second device, which plain cookie sessions
 * cannot give either. Moving to a server-issued token later only means
 * changing where `resolveSessionToken` reads from.
 */

const storageKey = (userId: number) => `live-chat:session-token:${userId}`;

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
