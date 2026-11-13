import { io } from "socket.io-client";
import { readLiveJson } from "@/lib/readLiveJson";

export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  autoConnect: false,
});

/**
 * The handshake credential: a socket ticket from GET /api/socket-ticket, not
 * the session's access token (see that route). A ticket is valid for a minute
 * and for any number of handshakes, so the default namespace and `/support`,
 * which connect together, share one read; kept for half its life at most, a
 * reconnection attempt always presents one with time to spare.
 */
const TICKET_REUSE_MS = 30_000;

let held: { ticket: string; at: number } | null = null;
let pending: Promise<string | null> | null = null;

function socketTicket(): Promise<string | null> {
  if (held && Date.now() - held.at < TICKET_REUSE_MS) {
    return Promise.resolve(held.ticket);
  }
  pending ??= readLiveJson<{ ticket?: string }>("/api/socket-ticket")
    .then((response) => {
      const ticket = response?.data?.ticket ?? null;
      held = ticket ? { ticket, at: Date.now() } : null;
      return ticket;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

/** Forget the held ticket: the session it was issued for is over. */
export function forgetSocketTicket() {
  held = null;
}

/**
 * socket.io's `auth` as a function, which it calls at every connection
 * attempt: each one presents a current ticket. With no session there is no
 * ticket, and the handshake is refused as it was for a missing token.
 */
export const ticketAuth =
  (extra: Record<string, unknown> = {}) =>
  (send: (data: object) => void) => {
    void socketTicket().then((ticket) =>
      send({ ...(ticket ? { token: ticket } : {}), ...extra }),
    );
  };
