# Slack — messaging integration (Dashboard Implementation Spec)

> **Audience:** the dashboard (client-side) AI agent / frontend engineer.
> **Backend status:** fully implemented. Every endpoint below exists and behaves exactly as documented — this spec was written against the actual backend code.
> **Companion doc:** `app_integrations_dashboard_spec.md` is the base spec. The envelope, roles model, popup/postMessage flow, and 401 no-logout rule (§3, §6) all apply. **Everything else about Slack is different** — read §1 before reusing any provider UI.

Provider key (for the postMessage filter and the registry): **`slack`**.

---

## 1. Slack is NOT a project-management provider — do not clone the PM card

Slack is a **messaging surface**, not a data source. There is nothing to import and nothing syncs into projects/tasks. Concretely:

- **No** `/slack/boards`, **no** import endpoint, **no** sync endpoint, **no** imported-projects rows, **no** assignee-matching UI. If you render an "Import" button or a board picker for Slack, it is a bug.
- Integration `type` is **`messaging`** (a new enum value), not `project_management`.
- What the backend actually does with Slack, so your helper copy can be truthful:
  1. **Event DMs** — assigned members get a Slack DM when an event is created / rescheduled / they are added / it is cancelled, plus a reminder DM N minutes before start (N = `reminder_minutes`, default 10).
  2. **Notification mirror** — in-app notifications (leave, project, task, unusual activity) are also delivered as Slack DMs. Event-reason notifications are excluded (covered by 1).
  3. **Tracking status sync** — while a member is *actively tracking*, their Slack status shows "⏱ Tracking time". It is set only while tracking, auto-expires within 20 minutes as a failsafe, clears shortly after they pause, and **never overwrites a status the user typed themselves**.
- **Two tokens, two connect flows** (this is the big UI difference):

| | Workspace connect | Personal connect |
| --- | --- | --- |
| Who | **admin only** | any authenticated member |
| Endpoint | `GET /slack/connect` | `GET /slack/connect/personal` |
| Grants | bot token for the company workspace | the member's own user token |
| Powers | event DMs, notification mirror, member lookup | status sync for that member only |
| Prerequisite | — | workspace must already be connected, **same Slack workspace** |
| Stored in | company-level integration | per-user integration |

- Slack tokens **do not expire** and there are no refresh tokens. **No `token_expiry` field exists anywhere in the Slack payloads** — typed clients must treat it as absent, not `null`. Never render a token-expiry surface.
- `status ∈ connected | disconnected | expired | revoked` on both levels. `expired`/`revoked` only appear if Slack invalidates a token (app uninstalled from Slack's side, user deauthorized). Render both identically: "Connection lost — reconnect".

---

## 2. Endpoint reference (exact contracts)

Same envelope as the base spec §3: `{ "statusCode", "success", "message", "data", "meta" }` on success, `{ "success": false, "message", "errorMessages": [...] }` on error. All routes are under `/api/v1`.

### 2.1 `GET /slack/connect` — admin only, **201**

`data` is the Slack authorize URL string. Envelope message: `"Fetch slack auth url successfully"`.

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Fetch slack auth url successfully",
  "data": "https://slack.com/oauth/v2/authorize?client_id=…&scope=chat%3Awrite%2Cim%3Awrite%2Cusers%3Aread%2Cusers%3Aread.email%2Cteam%3Aread&user_scope=users.profile%3Aread%2Cusers.profile%3Awrite&redirect_uri=…&state=…"
}
```

- Open in the standard popup (base spec §6). The install flow also captures the connecting **admin's own user token**, so after a workspace install the admin's *personal* card flips to connected too — no second popup needed for them.
- **500** `"Slack OAuth configuration is missing"` only if server env is missing — treat as a support-contact error, not a retry.

### 2.2 `GET /slack/connect/personal` — any authenticated user, **201**

`data` is the authorize URL string (user scopes only, pinned to the company workspace via `&team=`). Envelope message: `"Fetch slack personal auth url successfully"`.

- **400** `"Your company has not connected a Slack workspace yet. Ask an admin to connect Slack first."` — render this as the personal card's empty state for members when `workspace.connected === false` (see §4) instead of letting them click into the error.

### 2.3 `GET /slack/callback` — public redirect target (popup); the dashboard never calls it

Renders the same styled popup page as every provider and posts to `window.opener`:

```json
{
  "type": "staff-time-tracker:integration-callback",
  "provider": "slack",
  "success": true,
  "providerEmail": null,
  "tokenExpiry": null
}
```

- Filter on `event.data.provider === 'slack'`. `providerEmail` and `tokenExpiry` are **always `null`** for Slack.
- ⚠️ The payload does **not** say whether it was the workspace or the personal flow that completed. Don't try to infer it — on any Slack callback message (success or failure), **refetch `GET /slack/status` once** and let both cards re-render from it.
- Failure paths render the same page with `success: false`. Provider-denied and stale-state cases the page can show: `"Slack authorization failed: <reason>"`, `"Slack callback requires both code and state"`, `"OAuth state has expired"`, `"Invalid Slack OAuth state"`, `"Slack did not return a workspace token. Please try connecting again."`, `"Slack did not return a user token. Please try connecting again."`, and — personal flow only — the wrong-workspace error in §5.

### 2.4 `GET /slack/status` — any authenticated user, **200**

Envelope message: `"Slack integration status fetched successfully"`. **The shape is NOT the flat provider shape used by monday/Trello/etc.** — it is a two-section object:

```json
{
  "provider": "slack",
  "workspace": {
    "status": "connected",
    "connected": true,
    "team_id": "T0123ABCD",
    "team_name": "Orbit Technology",
    "settings": {
      "notify_events": true,
      "notify_dm": true,
      "status_sync": true,
      "reminder_minutes": 10
    },
    "connected_by": 12,
    "last_synced_at": "2026-08-06T09:30:00.000Z",
    "disconnected_at": null
  },
  "personal": {
    "status": "connected",
    "connected": true,
    "slack_user_id": "U0456EFGH",
    "status_sync": true,
    "last_synced_at": "2026-08-06T09:31:00.000Z",
    "disconnected_at": null
  }
}
```

- `workspace` reflects the **company**; `personal` reflects **the requesting user only**. Members see the same workspace section admins see (read-only for them).
- Never-connected sections collapse to `{ "status": "disconnected", "connected": false }` with **no other keys** — guard all optional fields.
- `connected_by` is the app user id of the installing admin. `workspace.settings` is present whenever a workspace row exists (even in `revoked`/`disconnected` states — settings survive reconnects).
- `personal.status_sync` is the member's own toggle; `workspace.settings.status_sync` is the company-wide kill switch. Effective sync = both true (see §3).

### 2.5 `DELETE /slack/disconnect` — admin only, **200**

Envelope message: `"Slack workspace disconnected successfully"`. `data` = the full §2.4 status payload (workspace now `disconnected`).

- ⚠️ **Not idempotent** (unlike Trello): calling it when the workspace is not connected returns **400** `"Slack workspace is not connected"`. Disable the button unless `workspace.connected`.
- Disconnecting the workspace stops event DMs and notification mirrors immediately. **It does not disconnect members' personal rows** — their status sync keeps working. Surface this in the confirm dialog copy (§4).

### 2.6 `DELETE /slack/disconnect/personal` — any authenticated user, **200**

Envelope message: `"Slack account disconnected successfully"`. `data` = the full §2.4 status payload.

- **400** `"Your Slack account is not connected"` when there is nothing to disconnect — disable the button unless `personal.connected`.
- Best-effort clears the member's "Tracking time" status before dropping the token; a hand-typed custom status is never touched.

### 2.7 `PATCH /slack/settings` — admin only, **200**

Body — every field optional, **at least one required**:

```json
{ "notify_events": true, "notify_dm": false, "status_sync": true, "reminder_minutes": 15 }
```

- `notify_events` / `notify_dm` / `status_sync`: booleans. `reminder_minutes`: integer **1–1440**.
- Zod rejects an empty body with `"At least one setting must be provided"` (standard validation envelope).
- **400** `"Slack workspace is not connected"` if there is no connected workspace.
- **200** envelope message `"Slack settings updated successfully"`; `data` is the **full resolved settings object** (not just the changed keys):

```json
{ "settings": { "notify_events": true, "notify_dm": false, "status_sync": true, "reminder_minutes": 15 } }
```

- `reminder_minutes` applies to reminders scheduled **after** the change; already-queued reminders keep their old lead time. Don't promise retroactive effect in the UI.

### 2.8 `PATCH /slack/settings/personal` — any authenticated user, **200**

Body (required): `{ "status_sync": true | false }`.

- **400** `"Your Slack account is not connected"`.
- **200** envelope message `"Slack personal settings updated successfully"`; `data`: `{ "status_sync": false }`.
- Turning it **off** also clears an active "Tracking time" status right away (custom statuses are never touched).

---

## 3. Settings semantics — what each toggle really controls

| Setting | Level | Default | Effect when off |
| --- | --- | --- | --- |
| `notify_events` | company | `true` | No event DMs and no event reminders for anyone |
| `notify_dm` | company | `true` | No notification-mirror DMs for anyone |
| `status_sync` (company) | company | `true` | No member's Slack status is synced, regardless of personal toggles |
| `reminder_minutes` | company | `10` | — (lead time for the pre-event reminder DM, 1–1440) |
| `status_sync` (personal) | member | `true` | Only this member's status stops syncing |

Effective status sync for a member = `workspace.settings.status_sync && personal.status_sync && personal.connected`. Compute and display this resolved state on the member-facing surface ("Status sync is paused by your admin" when the company switch is the blocker).

---

## 4. UI blueprint

**Integrations page — Slack card (admin view).** One card, two stacked sections:

1. **Workspace** — connect/disconnect + `team_name` when connected + the three company toggles and a `reminder_minutes` number input (patch on change, optimistic with rollback on error). Disconnect confirm copy: *"Stops Slack event messages and notification mirroring for everyone. Members who linked their own Slack accounts keep their status sync until they disconnect individually."*
2. **Your account** — the admin's own personal section (same component as the member surface below). After a workspace install, refetch shows this connected automatically (§2.1).

**Member-facing surface** (profile → connected apps, and the same card in read-only form on the integrations page):

- `workspace.connected === false` → static hint: *"Ask an admin to connect Slack first."* (mirrors the §2.2 400 — don't let members hit the error).
- `workspace.connected === true`, `personal.connected === false` → "Connect your Slack account" → popup with §2.2 URL. Benefit copy: *"Shows '⏱ Tracking time' on your Slack profile while you're tracking. Your own custom statuses are never overwritten."*
- Connected → status-sync toggle (with the resolved-state logic from §3) + disconnect.

**States to handle on both levels:** `revoked`/`expired` → "Connection lost — reconnect" (same treatment); `disconnected` with `disconnected_at` set → normal reconnect CTA.

**Live-behavior caveat for helper text:** status sync is intentionally throttled — the Slack status can lag the timer by a few minutes in both directions, and always clears itself within 20 minutes as a failsafe. Word member-facing copy as "while you're tracking", never "instantly".

---

## 5. Errors & edge cases the frontend must handle

- **Wrong workspace on personal connect** — popup failure page with: `"This Slack account belongs to a different workspace than the one your company connected. Please sign in to the company workspace and try again."` The member's fix is switching workspaces inside Slack's OAuth screen; keep the personal card's CTA available for retry.
- **Workspace reinstall** (connect while already connected) is allowed and idempotent — it refreshes the bot token and **preserves the admin's saved settings**. No special UI needed; refetch status.
- **No 409 in-flight semantics** for Slack (that rule is import-specific in the base spec). The only 4xx you'll see outside validation are the 400s quoted verbatim in §2.
- **401 handling** follows the base spec no-logout rule.
- Settings PATCH failures return the standard validation envelope — map `errorMessages[].path`/`message` onto the toggles/inputs.
- Delivery is fire-and-forget from the product's perspective: there is **no per-message delivery status API**. Do not build a "sent/failed" surface for DMs.

---

## 6. Do-not list (senior review will bounce these)

1. No import/boards/sync UI, no assignee matching, no imported-projects rows for Slack.
2. No token-expiry countdowns, badges, or reconnect-cadence copy — the fields don't exist.
3. Don't infer the callback mode from the postMessage — always refetch `/slack/status`.
4. Don't gate the personal card on the *member's* role — personal connect is for every role, including `employee`.
5. Don't call workspace disconnect "remove Slack for everyone" — personal status sync survives it (§2.5); the copy in §4 is accurate.
6. Don't debounce-spam `PATCH /slack/settings` per keystroke on `reminder_minutes` — patch on blur/commit.
