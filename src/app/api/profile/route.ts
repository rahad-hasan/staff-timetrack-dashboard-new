import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { liveJson, unauthorizedResponse } from "@/lib/server/liveJson";
import { isSessionToken } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/**
 * The user a token was issued for: its `id` claim (backend helper/jwt.ts),
 * which is the very id `GET /auth/session` answers with — auth() looks the
 * user up by it. Read here without verifying: the API verifies the token on
 * the read this id is used for, so a forged one gets its 401 there.
 */
function tokenUserId(token: string): number | null {
  try {
    const { id } = jwtDecode<{ id?: unknown }>(token);
    return typeof id === "number" && Number.isSafeInteger(id) && id > 0
      ? id
      : null;
  } catch {
    return null;
  }
}

/**
 * `GET /api/profile` → the viewer's own employee record
 * (`GET /auth/employees/:id`), the one read that returns their signed avatar
 * URL and their phone. Read by utils/profileImageRefresh.ts for the header and
 * sidebar avatars, which mount with every page.
 *
 * A route handler rather than the `getMyProfile` server action: an action
 * settling during hydration — or queued behind the user's saves — is what a
 * read must never be (see liveJson). The id is the token's own, not asked of
 * `/auth/session` first: that read only returned the same id, on every hard
 * load, in front of the one that matters. A dead session answers a JSON 401,
 * without a call when the cookie holds no usable token. The record carries
 * its `id`, so the caller can tell whose it is.
 */
export async function GET() {
  const token = (await cookies()).get("accessToken")?.value;
  const id = isSessionToken(token) ? tokenUserId(token) : null;
  if (id === null) return unauthorizedResponse(token);
  return liveJson(`/auth/employees/${id}`);
}
