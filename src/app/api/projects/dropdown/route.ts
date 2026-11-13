import { liveJson } from "@/lib/server/liveJson";

export const dynamic = "force-dynamic";

/**
 * `GET /api/projects/dropdown?search=` → `{ data: { id, name }[] }`, the
 * projects the viewer may pick, by name (`GET /projects?dropdown=true`). Read
 * by the project picker (SelectProjectWrapper) when it mounts and as the user
 * types.
 *
 * A route handler rather than the `getProjects` server action: the picker
 * mounts with the page, and an action settling during hydration — or queued
 * behind the user's saves — is what a read must never be (see liveJson).
 * Answers 401 when the session is gone.
 */
export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get("search");
  return liveJson("/projects", { search, dropdown: true });
}
