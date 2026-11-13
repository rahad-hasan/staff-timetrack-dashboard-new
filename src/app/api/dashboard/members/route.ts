import { liveJson } from "@/lib/server/liveJson";

export const dynamic = "force-dynamic";

/**
 * `GET /api/dashboard/members?project_id=` → `{ data: { id, name, image }[] }`,
 * the members the viewer may pick (all of the company, a project manager's own
 * people, an employee alone), optionally only one project's assignees
 * (`GET /dashboard/members`). Read through `useDashboardMembers` by every
 * member picker.
 *
 * A route handler rather than the `getMembersDashboard` server action: the
 * pickers mount with the page, and an action settling during hydration — or
 * queued behind the user's saves — is what a read must never be (see
 * liveJson). Answers 401 when the session is gone.
 */
export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("project_id");
  return liveJson("/dashboard/members", { project_id: projectId });
}
