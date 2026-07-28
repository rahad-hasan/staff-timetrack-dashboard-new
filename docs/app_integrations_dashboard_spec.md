# App Integrations — Dashboard Implementation Spec (monday.com first)

> **Audience:** the dashboard (client-side) AI agent / frontend engineer.
> **Backend status:** fully implemented and deployed on branch `monday`. Every endpoint below exists and behaves exactly as documented — this spec was written against the actual backend code, not a design draft.
> **Scope:** a new **"App Integrations"** tab inside **Admin Settings**, launching with **monday.com** (project-management sync). ClickUp, Jira, Asana and Slack will follow — build the UI so a new provider is added by registry entry, not by copy-paste (see §9).

---

## 1. What this feature does (mental model)

The backend links a company's monday.com account to the time tracker:

- monday **Board → Project**, monday **Item → Task**. Imported rows are ordinary `Project`/`Task` records — the rest of the app (tracker, time entries, reports) needs **zero changes** and there is **no special UI** for imported projects beyond an optional badge.
- The connection is **company-level**: one admin connects once via OAuth; the token is stored server-side. monday tokens never expire, so there is no re-auth cycle unless the user revokes access (status becomes `revoked`).
- After import, changes in monday (new item, rename, delete/archive) flow in automatically via **webhooks** — the dashboard does not poll for them. A manual **Sync** button exists as a recovery/refresh tool.
- Assignees are matched **by email** (monday user email ⇄ app user email, case-insensitive). Unmatched people fall back to the importing admin, and the API reports them so the UI can warn.

The dashboard's job is only: **connect / show status / pick boards / import / sync / disconnect / surface warnings.**

---

## 2. Access control

| Capability | Role |
|---|---|
| See the "App Integrations" tab in Admin Settings | `admin` only — hide the tab for every other role |
| `GET /monday/status` | any authenticated user (usable for a read-only "connected" indicator elsewhere) |
| connect / boards / import / sync / disconnect | `admin` only — backend enforces with 403; the UI must not render these controls for non-admins |

---

## 3. API conventions (whole module)

- Base path: `{API_URL}/api/v1/monday`. Auth: the app's standard mechanism (Bearer `accessToken` header or `accessToken` cookie) — reuse the existing dashboard API client.
- **Success envelope** (all endpoints except the OAuth callback and the webhook endpoint):

```json
{ "statusCode": 200, "success": true, "message": "…", "data": <payload>, "meta": null }
```

`meta` is always present and always `null` for monday endpoints — typed clients must tolerate it.

- **Error envelope** (from the global error handler):

```json
{ "success": false, "message": "…", "errorMessages": [{ "path": "…", "message": "…" }] }
```

In non-production environments an additional `stack` string field is included — dev-time response assertions must tolerate it.

- **⚠️ 401 interceptor warning (important):** the backend returns **HTTP 401** with message `"monday.com rejected the access token. Please reconnect the account."` when *monday* revokes the company's token. This is **not** a session expiry. If the dashboard has a global 401 → logout/redirect interceptor, it must **not** fire for `/api/v1/monday/*` responses whose message starts with `monday.com` — instead refetch status (it will now be `revoked`) and show the reconnect state.

---

## 4. Endpoint reference (exact contracts)

### 4.1 `GET /monday/connect` — get the OAuth URL
- Role: `admin`. Returns **201**.
- `data` is a **plain string** — the monday authorize URL:

```json
{ "statusCode": 201, "success": true, "message": "Fetch monday auth url successfully", "data": "https://auth.monday.com/oauth2/authorize?client_id=…&redirect_uri=…&state=…" }
```

- Errors: **500** `"monday.com OAuth configuration is missing"` if server env vars are absent — show "Integration not configured on the server, contact support", do not retry-loop.

### 4.2 `GET /monday/callback` — **backend-only**, do not call
The popup lands here after monday consent. The backend renders a styled HTML result page itself (success *and* failure) and posts a message to `window.opener` — see §6.1. The dashboard needs **no route** for this.

### 4.3 `GET /monday/status`
- Role: any authenticated. Returns **200**.
- Connected shape:

```json
{
  "id": 3,
  "provider": "monday",
  "type": "project_management",
  "status": "connected",
  "connected": true,
  "provider_email": "admin@company.com",
  "external_account_id": "12345678",
  "metadata": { "account_user_id": "12345678", "account_user_name": "Rahim" },
  "scope": ["boards:read", "users:read", "webhooks:write"],
  "last_synced_at": "2026-07-24T10:12:00.000Z",
  "disconnected_at": null
}
```

- Never-connected shape (note: **no `id`**):

```json
{ "provider": "monday", "type": "project_management", "status": "disconnected", "connected": false }
```

- `status` ∈ `connected | disconnected | expired | revoked`. Treat `expired` and `revoked` identically in the UI: "Connection lost — reconnect" (same CTA as connect).
- **Nullable fields:** `provider_email` and `metadata.account_user_name` can each be `null` (monday may withhold them). Header fallback: render whichever is present; if both are null show "monday.com account".

### 4.4 `DELETE /monday/disconnect`
- Role: `admin`. Returns **200** with the serialized integration (`status: "disconnected"`, `connected: false`, `disconnected_at` set).
- Server behavior worth reflecting in the confirm dialog: webhooks are de-registered best-effort, the token is deleted, **but imported projects/tasks remain** and become ordinary app data. Reconnecting later re-links the same boards (mapping rows are kept).
- **Reconnect caveat:** reconnecting does **not** re-register webhooks — automatic updates stay off until the user runs **Sync** (or re-imports) once, which re-registers them per board. After a successful reconnect, prompt: "Run Sync once to re-enable automatic updates."

### 4.5 `GET /monday/boards`
- Role: `admin`. Returns **200**. Calls monday's API live — **can take several seconds**; show a loading state.
- `data`:

```json
[
  {
    "id": "4521369870",
    "name": "Website Redesign",
    "description": null,
    "items_count": 42,
    "workspace": { "id": "112", "name": "Main workspace" },
    "already_imported": true,
    "project_id": 87
  },
  {
    "id": "4521369999",
    "name": "Mobile App",
    "description": "Q3 roadmap",
    "items_count": 12,
    "workspace": null,
    "already_imported": false,
    "project_id": null
  }
]
```

- `id` is a **string** — keep it a string end-to-end. `project_id` is **always present**: `number | null` (`null` when not imported). `workspace` can be `null`. `already_imported: true` ⇒ show an "Imported" badge and (optionally) link to `project_id`; the board is still selectable — re-importing acts as a re-sync of that board, it never duplicates.
- Errors: 400 `"monday.com is not connected for this company"` (race: connection dropped) → refetch status; 401 monday-revoked (see §3); 400 `"monday.com rate limit reached. Please try again in a minute."` → show retry hint, do not auto-hammer.

### 4.6 `POST /monday/import`
- Role: `admin`. Returns **201**.
- Body:

```json
{
  "board_ids": ["4521369870", "4521369999"],
  "start_date": "2026-08-01T00:00:00.000Z",
  "deadline": "2027-08-01T00:00:00.000Z"
}
```

- Rules (mirror them client-side before submitting):
  - `board_ids`: 1–25 entries, numeric strings (numbers also accepted). **Cap selection at 25 in the UI.**
  - `start_date` / `deadline`: **optional**, but when sent they MUST be **UTC ISO datetime strings ending in `Z`** — bare dates (`"2026-08-01"`), zone-less datetimes, and offset forms (`"…+06:00"`) are all **rejected**. Always produce them with `date.toISOString()` and nothing else.
  - `deadline ≥ start_date`; and if `deadline` is sent **without** `start_date`, it must not be in the past (server treats start as "now").
  - Omitted defaults: `start_date` = import moment; `deadline` = **`start_date` + 1 year** (anchored to the effective start date, not to "today"). Helper text: "Start defaults to now; deadline defaults to one year after the start date."
- Response `data` (`ImportResult`):

```json
{
  "imported": [
    {
      "board_id": "4521369870",
      "board_name": "Website Redesign",
      "project_id": 87,
      "created": true,
      "tasks_created": 40,
      "tasks_updated": 0,
      "tasks_skipped": 2,
      "items_truncated": false,
      "webhooks_registered": true
    }
  ],
  "skipped_boards": [
    { "board_id": "999", "reason": "Board not found or not accessible" }
  ],
  "unmatched_monday_users": [
    { "id": "9981", "name": "Freelancer Guy", "email": "freelancer@gmail.com" }
  ]
}
```

- Semantics for the result screen:
  - `created: false` ⇒ the board was already linked; this run updated it (re-sync).
  - `tasks_skipped` counts unchanged items and per-item failures — not an error by itself.
  - `items_truncated: true` ⇒ the board has more than ~3000 items; only the first ~3000 synced. **Re-running Sync does NOT fetch the rest** (there is no continuation cursor — each run re-reads from the top with the same cap). Warning copy: "Very large board — only the first ~3000 items were imported. New items will still arrive via live updates."
  - `webhooks_registered: false` ⇒ live auto-sync could not be enabled for that board. Warning: "Automatic updates unavailable for this board — use Sync."
  - `unmatched_monday_users` ⇒ warning list: "These monday users have no matching account here (by email); their items were assigned to you." Suggest inviting them with the same email.
- Errors: **409** `"A monday.com import or sync is already running for this company"` → show "An import is already in progress, try again shortly" (do NOT retry automatically); Zod 400s land in `errorMessages`; 400 rate-limit / complexity messages → retry hint.
- **Latency:** an import of many/large boards legitimately runs for **minutes**. Use a long client timeout (≥ 5 min) for this call and a blocking progress state — concretely: a modal with dismissal disabled while the mutation is pending, plus a `beforeunload` warning ("Import in progress — leaving now will hide the result"). If the user reloads anyway, the import keeps running server-side; after reload just show the plain detail view (there is no endpoint to query an in-flight run) — a retried import is harmless (re-import re-syncs; a still-running one answers 409). Disable the submit button while pending; the backend also rejects concurrent runs on the same server instance with 409, but the client must never rely on that alone.

### 4.7 `POST /monday/sync`
- Role: `admin`. No body. Returns **200** with the same `ImportResult` shape, plus optionally:

```json
{ "…": "…", "remaining_board_ids": ["555", "556"] }
```

- The server processes at most **25 boards per call**, oldest-synced first. When `remaining_board_ids` is present show: "N boards still pending — Continue sync" and let the user click again. Rotation caveat: only **successfully synced** boards move to the back of the queue — boards that keep failing/skipping stay at the front, so **stop any auto-continue loop when two consecutive calls return identical `remaining_board_ids`** (surface the skip reasons instead). An auto-continue loop is acceptable **only** with a visible "Stop" control and a 2–3 s pause between calls.
- **Result aggregation across continuation calls:** merge, don't replace — sum the numeric counters, concatenate `imported` and `skipped_boards` rows, and union `unmatched_monday_users` de-duplicated by `id`. Show one combined result screen at the end.
- Errors: 400 `"No monday.com boards have been imported yet"` (sync clicked before any import — disable the button when nothing is imported); 409 in-flight (same as import).

### 4.8 `POST /monday/webhook` — **backend-only**, never called by the dashboard. Listed here so the agent does not "helpfully" build anything for it.

---

## 5. Where it lives in the dashboard

```
Admin Settings
└── App Integrations            ← NEW tab (admin only)
    ├── Integrations hub        ← default view: provider cards
    └── monday.com detail       ← card click → detail panel/page
```

Suggested routes (adapt to the dashboard's existing router conventions): `/settings/integrations` and `/settings/integrations/monday`.

### 5.1 Integrations hub (cards grid)

One card per provider from the **registry** (§9): logo, name, one-liner, and either a status chip (`Connected` / `Not connected` / `Connection lost`) for available providers or a **"Coming soon"** disabled state.

Launch content:

| Provider | Category | State |
|---|---|---|
| monday.com | Project management sync | **Available** |
| ClickUp | Project management sync | Coming soon |
| Jira | Project management sync | Coming soon |
| Asana | Project management sync | Coming soon |
| Slack | Meetings & events (like Google/Microsoft) | Coming soon |

The monday card's chip is driven by `GET /monday/status`.

### 5.2 monday.com detail — the four UI states

1. **Not connected** (`status: disconnected`, never or after disconnect): explainer ("Import your monday boards as projects; items become tasks; changes sync automatically") + **Connect monday.com** button + note "Only a company admin can connect".
2. **Connected** (`status: connected`): header with `provider_email` / `metadata.account_user_name` (both nullable — see §4.3 fallback), "Last synced" (`last_synced_at`, relative time); actions: **Import boards**, **Sync now**, **Disconnect**; below: imported-boards list — derived from `GET /monday/boards` filtered to `already_imported`, each linking to its `project_id`. **The boards query is fetched on detail-view mount** (when connected), not only when the picker opens — the imported list and the Sync-disable rule both depend on it (§7).
3. **Connection lost** (`status: expired | revoked`): alert banner "monday.com revoked the connection — reconnect to resume syncing". Controls in this state, explicitly: **Reconnect** (primary, same flow as connect) + **Disconnect** (secondary, for companies that want to remove the integration instead). **Import boards, Sync, and the boards list are hidden** — `/monday/boards` would 401 in this state. Existing imported projects/tasks keep working.
4. **Loading / error**: skeletons; on 5xx a plain retry state.

---

## 6. Flows

### 6.1 Connect (OAuth popup + postMessage)

The google/microsoft integrations in this app already use the **same** callback-page/postMessage mechanism — if the dashboard has a popup helper for those, **reuse it** and just parameterize the provider.

```
click Connect
→ GET /monday/connect            (grab data = url)
→ window.open(url, 'monday-oauth', 'width=620,height=760')
→ listen: window.addEventListener('message', handler)
   accept only messages where:
     event.data?.type === 'staff-time-tracker:integration-callback'
     event.data?.provider === 'monday'
   payload: { type, provider, success: boolean, providerEmail: string|null, tokenExpiry: null }
→ on valid message:
   - close the popup if still open (it does NOT auto-close itself) and stop the closed-poll
   - refetch status
   - success:true → toast "monday.com connected"
   - success:false → ONE uniform neutral toast: "Connection was not completed" — the payload
     carries no failure reason (denied consent, non-admin, token-exchange error are
     indistinguishable to the opener; the popup page itself already showed the details)
→ fallback: poll popup.closed every 1s; when it closes and NO message was received,
   refetch status once silently (no toast) — covers browsers that block opener messaging
→ remove the message listener when the popup closes or the detail view unmounts
```

Notes: the callback page posts with `targetOrigin: '*'` — validate by `type` + `provider` fields (and optionally `event.origin === API origin`). `tokenExpiry` is always `null` for monday (tokens don't expire) — do not render a token-expiry field. If `window.open` returns `null` (popup blocked), show "Allow popups for this site" guidance.

### 6.2 Import boards (picker → run → result)

1. Open picker (modal or sub-page) → `GET /monday/boards` (loading state; can be slow).
2. Render checkbox list: name, workspace name, `items_count`, "Imported" badge when `already_imported`. Provide a client-side text filter — accounts can have hundreds of boards. Selection cap **25** with a visible counter ("12 / 25 selected"); disable further checks at 25.
3. Optional "Project defaults" collapsible: Start date & Deadline pickers (helper text: "Applied to newly created projects only. Defaults: today / +1 year."). Client-validate the §4.6 rules; send `toISOString()` values, omit untouched fields.
4. Submit → blocking pending state (§4.6 latency) → render the **result screen**. When `imported` is **empty** (every selected board was skipped — e.g. deleted in monday between listing and import), present a warning-toned "No boards were imported" state with the `skipped_boards` reasons expanded by default instead of success chips. Otherwise:
   - summary chips: X projects created, Y updated, Z tasks created/updated;
   - per-board rows from `imported`;
   - collapsible warning sections for `skipped_boards` (show `reason` verbatim — the strings are human-readable), `unmatched_monday_users`, any `items_truncated` / `webhooks_registered:false` flags;
   - primary action "Done" → back to detail view; invalidate the status + boards queries **and the dashboard's project/task list caches** (new projects must appear in the Projects screen immediately).

### 6.3 Sync — button with pending state → same result rendering as import; handle `remaining_board_ids` (§4.7); afterwards invalidate project/task caches too.

### 6.4 Disconnect — confirm modal, copy: *"Disconnecting stops automatic syncing from monday.com. Projects and tasks already imported stay in the app and keep working. You can reconnect anytime — after reconnecting, run Sync once to re-enable automatic updates."* → `DELETE /monday/disconnect` → refetch status.

---

## 7. Data layer (React Query or equivalent)

| Key | Endpoint | Notes |
|---|---|---|
| `['integrations','monday','status']` | GET /status | staleTime ~30s; refetch on window focus; poll every 3s **only** while the connect popup is open |
| `['integrations','monday','boards']` | GET /boards | fetched on **detail-view mount** with `enabled: status === 'connected'` (feeds the imported-boards list and the Sync-disable rule); the picker reuses the cached data with a manual "Refresh" affordance; no background refetch (each call hits monday's API) |

Mutations (connect-url, import, sync, disconnect): on settle invalidate `status`; import/sync also invalidate `boards` **and existing project/task list keys**. Never fire import/sync mutations in parallel — the client itself must serialize them (the backend's 409 guard is per server instance, not a cluster-wide lock).

---

## 8. Edge-case & error matrix (implement every row)

| Situation | Detection | Required UI behavior |
|---|---|---|
| Server env not configured | 500 on /connect, message `monday.com OAuth configuration is missing` | "Not configured on server — contact support"; no retry loop |
| Popup blocked | `window.open` → null | Inline "allow popups" guidance |
| User closes popup mid-consent | popup.closed, no message | Silent single status refetch; no error toast |
| Any `success:false` callback message (denied consent, non-admin, exchange failure — indistinguishable to the opener) | message with `success:false` | One uniform neutral toast "Connection was not completed"; the popup page already showed the specific reason |
| Token revoked at monday | 401 + `monday.com rejected…` on any call | **No logout.** Refetch status → renders "Connection lost" state |
| Import/sync already running | 409 | Toast "Already in progress, try again shortly"; keep button disabled a few seconds |
| monday rate limit / complexity | 400 with those messages | Toast with the server message + manual retry |
| Board list empty | `data: []` | Empty state: "No boards found in this monday account" |
| >25 boards selected | client cap | Prevent selection past 25, show counter |
| Bare date sent as `start_date` | Zod 400 | Prevent by always sending `toISOString()`; still surface `errorMessages` generically |
| Sync with nothing imported | 400 `No monday.com boards…` | Disable Sync when no imported boards exist |
| Giant board truncated | `items_truncated: true` | Per-board warning (§4.6 copy) — do NOT advise re-running Sync; it cannot fetch the remainder |
| Webhooks failed for a board | `webhooks_registered: false` | Per-board warning: auto-sync off, manual Sync works |
| Unmatched monday users | `unmatched_monday_users` non-empty | Warning list + "invite with same email" hint |
| Very slow import | pending > a few seconds | Progress copy "can take a few minutes"; client timeout ≥ 5 min for import/sync |

---

## 9. Extensibility — future providers (ClickUp, Jira, Asana, Slack)

The backend will expose the **same endpoint family per provider** (`/clickup/connect`, `/clickup/status`, …) with the same envelope, status enum, and postMessage callback pattern. Build the frontend so a new provider costs one registry entry + (optionally) one provider-specific import panel:

```ts
// integrations/registry.ts
export type IntegrationKey = 'monday' | 'clickup' | 'jira' | 'asana' | 'slack';

export interface IntegrationDef {
  key: IntegrationKey;
  name: string;                    // "monday.com"
  logo: string;
  category: 'project_management' | 'meetings_events';
  blurb: string;                   // card one-liner
  available: boolean;              // false ⇒ "Coming soon" card
  apiBase: string;                 // "/monday" — every generic call derives from this
  capabilities: {
    boardPicker: boolean;          // monday/clickup/jira/asana: true; slack: false
    sync: boolean;
    importDefaults: boolean;       // start_date/deadline form
  };
}

export const INTEGRATIONS: IntegrationDef[] = [
  { key: 'monday', name: 'monday.com', category: 'project_management', available: true,  apiBase: '/monday', capabilities: { boardPicker: true, sync: true, importDefaults: true }, /* … */ },
  { key: 'clickup', name: 'ClickUp',   category: 'project_management', available: false, apiBase: '/clickup', /* … */ },
  { key: 'jira',    name: 'Jira',      category: 'project_management', available: false, apiBase: '/jira', /* … */ },
  { key: 'asana',   name: 'Asana',     category: 'project_management', available: false, apiBase: '/asana', /* … */ },
  { key: 'slack',   name: 'Slack',     category: 'meetings_events',    available: false, apiBase: '/slack', /* … */ },
];
```

Card copy (`blurb`) to use verbatim — do not author your own:

| Provider | blurb |
|---|---|
| monday.com | "Import boards as projects and keep tasks in sync automatically." |
| ClickUp | "Bring your ClickUp lists and tasks into the tracker." |
| Jira | "Sync Jira projects and issues as trackable work." |
| Asana | "Import Asana projects and tasks for time tracking." |
| Slack | "Schedule meetings and get event updates right in Slack." |

Logos: use the providers' official brand SVGs (each has a published brand-asset page); store them locally under the dashboard's existing static-assets convention — do not hotlink.

Keep **generic** (registry-driven, provider passed as prop): hub cards, status panel, connect/disconnect flow + popup listener (provider key in the message filter), sync button, result rendering. Keep **provider-specific**: the picker's terminology and columns ("Boards" for monday, "Lists"/"Spaces" for ClickUp, "Projects" for Jira/Asana). **Slack is a different category** (`meetings_events`): it will plug into the app's existing Event/scheduled-meeting system the way Google Calendar and Microsoft Teams do — event invites, meeting reminders and updates delivered through Slack — so it gets no board picker at all; its detail panel will follow the Event-integration pattern when its backend lands. Don't over-abstract the picker now — extract when the second provider arrives; everything else should be generic from day one.

---

## 10. Acceptance checklist

- [ ] "App Integrations" tab in Admin Settings, **visible to `admin` only**; hub renders 5 cards (1 available + 4 coming-soon) from a registry, not hard-code.
- [ ] Connect: popup flow works end-to-end incl. blocked popup, closed popup, denied consent; status flips to Connected without a page reload.
- [ ] Status panel renders all four states (§5.2) incl. `expired`/`revoked` → Reconnect.
- [ ] Board picker: live list, filter, imported badges, 25-cap with counter, optional defaults form producing valid ISO datetimes.
- [ ] Import + Sync: long-running pending UX, full result screen incl. every warning class in §8, 409 handling, `remaining_board_ids` continuation.
- [ ] Disconnect confirm modal with accurate consequences copy.
- [ ] The global 401 interceptor does **not** log the user out on monday-revoked responses.
- [ ] After import/sync, the Projects and Tasks screens show the new data without manual refresh (cache invalidation).
- [ ] No dashboard route exists for `/monday/callback`; no calls to `/monday/webhook`.
- [ ] All new components take the provider from the registry — adding ClickUp later must not require touching the hub, status panel, connect flow, or sync button.
