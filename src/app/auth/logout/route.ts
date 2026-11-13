import type { NextRequest } from "next/server";
import { clearSessionCookies } from "@/lib/sessionCookies";

/**
 * `POST /auth/logout` — ends the session: clears every session cookie
 * (`clearSessionCookies`), then answers 303 to the login page. The
 * sample-data dismissal cookie is deliberately NOT cleared: it names the user
 * who made it, so it cannot apply to the next one, and clearing it here made
 * the demo come back at that user's own next sign-in (see
 * actions/dashboard/sampleData.ts).
 *
 * A route handler, not a server action. An action that deletes cookies answers
 * with a fresh render of the page it was called from — on sign-out, a
 * protected page rendered with no token, so every read on it 401'd and its
 * redirect to /session-expired raced the client's own move to the login page.
 * This renders nothing. The browser side (`signOut` in lib/clientSession.ts)
 * then wipes its per-user state and leaves with a full page load, so no
 * client store, router cache or socket outlives the session.
 *
 * The Location is relative on purpose: behind `next start -H 127.0.0.1` the
 * request URL is the bind address, and an absolute URL built from it sent
 * real users to http://localhost:3000 (see middleware.ts).
 */
export async function POST(request: NextRequest) {
  // Same rule as the support relays: refuse a request the browser itself
  // labels as coming from another site, so no other page can sign users out.
  // A missing header (old engine) is allowed.
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site" || site === "same-site") {
    return Response.json(
      { success: false, message: "Cross-site request refused" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  await clearSessionCookies();

  return new Response(null, {
    status: 303,
    headers: { Location: "/auth/login", "Cache-Control": "no-store" },
  });
}
