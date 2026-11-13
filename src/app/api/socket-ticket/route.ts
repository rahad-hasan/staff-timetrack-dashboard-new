import { liveJson } from "@/lib/server/liveJson";

export const dynamic = "force-dynamic";

/**
 * `GET /api/socket-ticket` → a one-minute credential for the socket.io
 * handshake (`GET /realtime/socket-ticket`). Read by src/socket/socket.ts at
 * every connection attempt.
 *
 * The session's access token lives in an httpOnly cookie, and a handshake is
 * made by page JavaScript, so the token itself used to be passed down to it
 * as a prop: in every signed-in page's payload, readable by any script on the
 * page, and good for the whole API for as long as it lived. A ticket opens a
 * socket and nothing else, and expires in a minute. Answers 401 when the
 * session is gone.
 */
export async function GET() {
  return liveJson("/realtime/socket-ticket");
}
