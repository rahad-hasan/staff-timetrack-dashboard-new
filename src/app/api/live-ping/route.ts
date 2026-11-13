export const dynamic = "force-dynamic";

/**
 * `GET /api/live-ping` → `{ stamp }`: is this dashboard server answering, and
 * which build is it?
 *
 * Live refresh asks before every background `router.refresh()`, because Next
 * has no failure path for a refresh that keeps the page: a refresh that cannot
 * reach the server (offline, Wi-Fi still reconnecting after sleep, the proxy's
 * 502 while pm2 restarts the app) or that reaches a different build turns
 * into a full-page `location.replace` — onto the browser's error page, or
 * through a reload that drops whatever the user was typing. A 2xx here means
 * the refresh can land; `stamp` (see next.config.ts) tells the tab whether
 * the server is still the build it was loaded from.
 *
 * Deliberately trivial: no API call and no auth (`/api/**` is outside the
 * middleware matcher), so it answers in a millisecond and says nothing about
 * anyone. Tabs from older builds call it, so keep the path and the `{ stamp }`
 * shape stable. `no-store`: a cached answer would vouch for a server that is
 * gone.
 */
export function GET() {
  return Response.json(
    { stamp: process.env.NEXT_PUBLIC_BUILD_STAMP ?? "" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
