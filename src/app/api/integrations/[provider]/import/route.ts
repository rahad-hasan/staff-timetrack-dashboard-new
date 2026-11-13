import type { NextRequest } from "next/server";
import { relayIntegrationRun } from "@/lib/server/integrationRun";

// axios (lib/server/integrationRun.ts) runs on Node's http, not on the edge
export const runtime = "nodejs";

/**
 * `POST /api/integrations/:provider/import` — body `IntegrationImportPayload`
 * (`{ ids, start_date?, deadline? }`), answered with the neutral
 * `IntegrationImportResult` envelope. A route handler rather than a server
 * action because a run takes minutes; see lib/server/integrationRun.ts.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  return relayIntegrationRun(request, provider, "import");
}
