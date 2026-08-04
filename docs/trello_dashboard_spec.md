# Trello — fifth available provider (Dashboard Implementation Spec)

> **Audience:** the dashboard (client-side) AI agent / frontend engineer.
> **Backend status:** fully implemented on branch `monday`. Every endpoint below exists and behaves exactly as documented — this spec was written against the actual backend code.
> **Companion doc:** `app_integrations_dashboard_spec.md` is the base spec. Trello uses the **same endpoint family, envelope, roles, popup/postMessage flow, 401 no-logout rule, 409 in-flight message, and continuation/merge rules** as monday/ClickUp/Asana/Jira — §3–§8 of the base spec all apply. This document covers everything that differs, plus the full Trello endpoint contracts so you never have to read backend code.

Provider key (for the postMessage filter and the registry): **`trello`**.

---

## 1. Terminology, hierarchy & token model

| Trello concept | Maps to |
| --- | --- |
| Board | Project (one board → one app project) |
| Card | Task |
| List (column) | Task **status** — the list a card sits in *is* its workflow state |
| Label | Task **priority** (labels named "high"/"urgent"/"low" etc.) |
| Workspace (organization) | Grouping info shown on board rows — not imported itself |

- **Auth is OAuth 1.0a, not OAuth2.** Invisible to the dashboard except for one thing: the Trello **token never expires** (the backend requests `expiration=never` and Trello issues no refresh tokens). The connection lives until the admin disconnects or revokes it from Trello's side.
  - The callback postMessage always carries `tokenExpiry: null`.
  - The status payload has **no `token_expiry` field at all** — typed clients must treat it as *absent*, not `null`. Never render a token-expiry surface for Trello.
- Scope is fixed: `["read", "account"]`. The integration is **read-only towards Trello** — nothing the app does writes back to Trello.
- **Emails:** Trello only ever reveals the *connecting member's own* email. This is why assignee matching is name-based (§5) and why `unmatched_trello_users` rows always have `email: null` (§4.6).

---

## 2. Endpoint reference (exact contracts)

Same envelope as the base spec §3: `{ "statusCode", "success", "message", "data", "meta" }` on success, `{ "success": false, "message", "errorMessages": [...] }` on error.

### 2.1 `GET /trello/connect` — admin only, **201**

`data` is the Trello authorize URL string. Envelope message: `"Fetch trello auth url successfully"`.

```json
{ "statusCode": 201, "success": true, "message": "Fetch trello auth url successfully", "data": "https://trello.com/1/OAuthAuthorizeToken?oauth_token=…&name=Staff+Time+Tracker&scope=read%2Caccount&expiration=never" }
```

Differences from the OAuth2 providers:

- The backend performs a **server round-trip to Trello first** (OAuth 1.0a request token), so `/connect` itself can fail with **400** `"Trello did not issue a request token. Please try again."` — show the standard error toast with a retry; do not treat it as a configuration error.
- **One pending authorization per company.** A second Connect click supersedes the first: if the admin then completes the *first* popup, that popup shows the failure page with `"This Trello authorization has expired or was superseded. Please retry."` The superseding flow is unaffected.
- On Trello's authorize page the user clicks **Allow**. The grant is created as "never expires" — no re-consent cadence to communicate.

### 2.2 `GET /trello/callback` — public redirect target (popup); the dashboard never calls it

Renders the same styled popup page as every other provider and posts to `window.opener`:

```json
{ "type": "staff-time-tracker:integration-callback", "provider": "trello", "success": true, "providerEmail": "admin@company.com", "tokenExpiry": null }
```

- Filter on `event.data.provider === 'trello'`; `tokenExpiry` is always `null`.
- `providerEmail` may be `null` even on success (the identity fetch is best-effort; the connection still works).
- On any failure the same page posts `success: false` — refresh the status query on both outcomes, exactly like the other providers (base spec §6.1).

### 2.3 `GET /trello/status` — any authenticated user, **200**

Envelope message: `"trello integration status fetched successfully"`. Connected shape:

```json
{
  "id": 18,
  "provider": "trello",
  "type": "project_management",
  "status": "connected",
  "connected": true,
  "provider_email": "admin@company.com",
  "external_account_id": "68b2f0c9d4e5f6a7b8c9d0e1",
  "metadata": { "account_user_id": "68b2f0c9d4e5f6a7b8c9d0e1", "account_user_name": "Naim Uddin" },
  "scope": ["read", "account"],
  "last_synced_at": "2026-08-04T10:12:00.000Z",
  "disconnected_at": null
}
```

- `external_account_id` / `metadata.account_user_id` = the connecting Trello **member id** (24-hex). `metadata.account_user_name` = their Trello full name or username; nullable.
- `provider_email` nullable. **No `token_expiry` key** (see §1).
- Never-connected shape is identical to the other providers: `{ "provider": "trello", "type": "project_management", "status": "disconnected", "connected": false }` (no `id`).
- `status ∈ connected | disconnected | expired | revoked` — for Trello only `revoked` occurs on connection loss (tokens don't expire). Treat `revoked`/`expired` identically anyway: "Connection lost — reconnect".

### 2.4 `DELETE /trello/disconnect` — admin only, **200**

Envelope message: `"trello integration disconnected successfully"`. Returns the serialized integration with `status: "disconnected"`, tokens cleared, `disconnected_at` set (account identity fields are kept for display).

- Best-effort revokes the token at Trello, which also **deletes every board webhook** attached to it — after disconnect, nothing arrives from Trello anymore.
- Idempotent: disconnecting a never-connected company returns the never-connected shape with 200.
- Imported projects/tasks are untouched (same rule as every provider).

### 2.5 `GET /trello/boards` — admin only, **200** (replaces `/monday/boards`, `/clickup/lists`, `/asana/projects`, `/jira/projects`)

Envelope message: `"trello boards fetched successfully"`. Row shape — no task count is available:

```json
{
  "id": "665f0c9ad4e5f6a7b8c9d0e1",
  "name": "Website Redesign",
  "workspace": { "id": "60a1b2c3d4e5f6a7b8c9d0e2", "name": "Orbit Technology" },
  "already_imported": false,
  "project_id": null
}
```

- `id` is the canonical 24-hex board id — pass it to `/import` as-is.
- `workspace` is `null` for boards outside any workspace; `workspace.name` itself is nullable. Group or badge by workspace, but expect the null case.
- Server-side cap: the first **100 open boards** the connected member can see. Archived (closed) boards are excluded.
- `already_imported: true` rows carry the linked `project_id` — same imported-boards-list derivation as the base spec §5.2.

### 2.6 `POST /trello/import` — admin only, **201**

Body uses **`board_ids`** (1–25). Each id may be the 24-hex board id **or the 8-character shortLink** from a board URL (`https://trello.com/b/<shortLink>/…`) — both are accepted; results always report the canonical 24-hex id. `start_date`/`deadline` rules are identical to base spec §4.6 (UTC ISO strings, deadline ≥ start_date, deadline defaults to start + 1 year).

Validation messages: `"Board id must be a 24-character hex id or an 8-character short link"`, `"At least one board id must be provided"`, `"A maximum of 25 boards can be imported per request"`, `"Deadline must be the same as or later than start date"`, `"Deadline cannot be in the past when start date is omitted"`.

Envelope message: `"trello boards imported successfully"`. Result (`data`):

```json
{
  "imported": [{ "board_id": "665f0c9ad4e5f6a7b8c9d0e1", "board_name": "Website Redesign", "project_id": 91, "created": true, "tasks_created": 24, "tasks_updated": 0, "tasks_skipped": 2, "tasks_truncated": false, "webhook_registered": true }],
  "skipped_boards": [{ "board_id": "665f0c9ad4e5f6a7b8c9d0e2", "reason": "Board is closed (archived) on Trello" }],
  "unmatched_trello_users": [{ "id": "68c3a1b2d4e5f6a7b8c9d0e3", "name": "Md Rakib", "email": null }]
}
```

- `unmatched_trello_users[].email` is **always `null`** (§1) — render the name only; do not reserve an email column for Trello.
- `tasks_truncated: true` means the board has more than 3,000 open cards and the excess was not imported — surface the same truncation notice as other providers.
- `webhook_registered: false` ⇒ same warning treatment as the other providers: "Automatic updates unavailable for this board — use Sync."
- Known `skipped_boards.reason` strings: `"Board is closed (archived) on Trello"`, `"Trello board could not be loaded (deleted or not accessible)"`, `"Linked project was deleted in the app; remove the link to re-import"` — plus pass-through Trello error text for anything else. Render verbatim.
- Re-importing an already-imported board is a re-sync of that board — it never duplicates.

### 2.7 `POST /trello/sync` — admin only, **200**

No body. Envelope message: `"trello boards synced successfully"`. Same result shape as §2.6 plus optional **`remaining_board_ids`** — identical continuation semantics to the base spec §4.7: at most **25 boards per call, oldest-synced first**, successfully synced boards rotate to the back, merge continuation results (sum counters, concatenate rows, union unmatched users by `id`), stop any auto-continue loop when two consecutive calls return identical `remaining_board_ids`.

- **400** `"No Trello boards have been imported yet"` when nothing is linked.

### 2.8 `POST /trello/webhook` — backend-only

Called by Trello, HMAC-verified. The dashboard never calls it and never needs to know it exists.

---

## 3. How card data maps (for tooltips / help copy)

- **Status = the list the card is in.** The shared keyword map covers To&nbsp;Do/Doing/Done-style names; additionally for Trello: `review`/`testing`/`qa` → processing, `ideas`/`inbox`/`up next`/`on hold`/`blocked` → pending, `shipped`/`released` → complete. A card's **"due complete" checkbox always wins** and marks the task complete. Unknown custom list names leave the app status unchanged.
- **Priority = labels.** Labels whose names match the shared priority vocabulary (high/urgent/medium/low…) set task priority; with several priority labels the most severe wins; no priority label → priority left unchanged.
- **Deadline = the card's due date.**
- **Archived cards are skipped, never deleted.** Deleting a card in Trello deletes the task — unless it has tracked time, in which case it survives as a native task (standard engine rule).
- Long text is truncated with a trailing `…`: card/task names at 512 chars, descriptions at 2,000, board/project names at 255.

---

## 4. Assignee matching — the weakest of the five providers; set expectations in the UI

Trello exposes **no member emails** (only the connecting account's own). Matching is therefore:

1. **Exact:** the connecting member themselves (their email is known from the OAuth handshake).
2. **Heuristic:** every other card member is matched by **exact full-name** comparison against company users (case-, whitespace- and Unicode-normalization-insensitive). If two company users share a name, that name **never** matches. Heuristic matches can never steal a task an admin already reassigned manually.
3. Everyone else lands in `unmatched_trello_users`; their tasks fall back to the importing admin / integration owner.

Recommended hint copy next to the unmatched list: *"Make sure this member's full name in Trello matches their name in Staff Time Tracker, then run Sync."*

---

## 5. Webhook model (why the Sync button still matters)

- One webhook **per imported board**, registered automatically during import and re-checked on every sync — reported per board via `webhook_registered`.
- **Real-time:** card created / renamed / description / due date / due-complete / moved between lists / archived / deleted, member added/removed, label added/removed.
- **Not real-time:** board renames, list renames, list creation — these land on the next Sync (a list rename can change which status its cards map to, so the standard *"Sync after being idle"* advice applies even though Trello webhooks, unlike Jira's, never expire).
- Under event bursts the backend may drop excess webhook deliveries to protect itself — Sync recovers anything missed. Same UI stance as the base spec: webhooks keep things fresh, **Sync is the recovery/refresh tool**, the dashboard never polls.
- **Reconnect caveat (same as all providers):** webhooks belong to the token, so after a disconnect + reconnect the fresh token has none until the next import or Sync. Show *"Run Sync once to re-enable automatic updates."* after a reconnect.

---

## 6. Error strings (for the base spec §8 matrix)

| HTTP | Exact message | Notes |
| --- | --- | --- |
| 400 | `Trello is not connected for this company` | boards/import/sync before connecting |
| 400 | `Trello access token is missing. Please reconnect the account.` | token unreadable — treat as connection lost |
| 401 | `Trello rejected the access token. Please reconnect the account.` | **the no-logout rule keys on this prefix** — do NOT clear the app session; flip UI to "Connection lost". Status becomes `revoked`. |
| 400 | `Trello denied access to this resource with the connected account (private or membership revoked)` | **per-resource**, not a broken connection — the board is private / membership was revoked. Show on the row/action, do not flip the connection UI. |
| 400 | `Trello rate limit reached. Please try again in a minute.` | after server-side retries were exhausted |
| 400 | `No Trello boards have been imported yet` | sync with nothing linked |
| 409 | `A Trello import or sync is already running for this company` | same in-flight treatment as other providers |
| 500 | `Trello API configuration is missing` | server misconfiguration (note: *API*, not *OAuth*, unlike the other providers' string) |
| 400 | `Trello did not issue a request token. Please try again.` | `/connect` — toast + retry |
| 400 | `Trello API request failed after retries` | transient network failure — toast + retry |
| 400 | `Trello error: <provider text>` / `Trello returned an unreadable response` | pass-through Trello errors — render verbatim |

Popup-page failure details (shown inside the callback popup, and posted as `success: false` — no dashboard string handling needed beyond refreshing status): `Trello authorization was denied or is incomplete`, `This Trello authorization has expired or was superseded. Please retry.`, `This Trello authorization has expired. Please retry.`, `This Trello authorization can no longer be completed. Please retry.`, `Only a company admin can connect Trello` (403), `Unable to authenticate with Trello`, `Trello authorization failed: <provider text>`.

---

## 7. Registry entry & what to reuse vs fork

Add to the base spec §9 registry:

```ts
{
  key: 'trello',
  name: 'Trello',
  available: true,
  capabilities: { list: '/trello/boards', importKey: 'board_ids', containerNoun: 'board', tokenExpiry: false },
}
```

- **Reuse unchanged:** the whole hub/detail UI, popup + postMessage flow (filter `provider === 'trello'`), status card, connect/disconnect confirms, import wizard, sync button with continuation loop, unmatched-users warning list, error matrix handling.
- **Fork (small):** list-endpoint labels ("Board", "Workspace" columns; workspace nullable); import body key `board_ids` (ids also accept 8-char short links if you let users paste board URLs — extract the `/b/<shortLink>/` segment); unmatched-users list renders **without an email column**; **no token-expiry surface anywhere** for Trello.
- **Hub counts (base spec §10):** with Trello the hub renders **5 available + 1 coming-soon (Slack)** cards.

Acceptance additions: Trello card shows in the hub as Available; connect → popup → status flips to connected without logout; import accepts pasted 24-hex ids and 8-char short links; unmatched list shows names without emails; no token-expiry text appears anywhere in the Trello detail view.
