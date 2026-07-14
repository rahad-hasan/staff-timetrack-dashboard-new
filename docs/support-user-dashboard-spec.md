# Support User Dashboard — Frontend Implementation Spec

**Client project:** End-user dashboard (employees, managers, HR, project managers — anyone with a regular role in the company)
**Consumes backend:** [Support Ticket & Feedback System](./support-ticket-spec.md)
**Executor:** AI coding agent building the frontend, acting as a **senior React/Next.js + TypeScript engineer**
**Mode:** Extend the existing dashboard codebase. NOT a greenfield project.

---

## How to run this spec

> Save this file as `docs/support-user-dashboard-spec.md` in the dashboard repo, open your coding agent in that repo, and prompt:
> *"Read `docs/support-user-dashboard-spec.md`. Discover the existing codebase first (Phase 0), then implement phase by phase. After each phase, run typecheck/lint and give me a short summary before continuing."*

---

## Global rules

1. **Codebase wins over this document.** Where this spec conflicts with existing conventions (routing, state management, API client, styling, form library) — adapt the spec to what already exists. Leave `// SPEC-ADAPTED:` comments at adaptation sites.
2. **This is the USER dashboard.** Do NOT build agent queue, admin analytics, or private-note viewing here. Those live in the separate agent/admin dashboard.
3. Authentication is already handled by the existing dashboard shell. You reuse the same JWT / cookie flow.
4. Every API call reuses the existing HTTP client (axios / fetch wrapper) — do NOT create a new one.
5. All new code is TypeScript strict, no `any`, no unhandled promise rejections.

---

## Phase 0 — Codebase discovery (mandatory, produce a summary, write no code)

Report a short summary of:

1. **Routing** — file-based (Next.js pages/app) or React Router? Where do new pages live?
2. **State/data fetching** — React Query, SWR, Redux, Zustand? Which is used for server state?
3. **HTTP client** — axios instance path, how the JWT is attached (interceptor? cookie?), base URL config.
4. **Auth context** — where the current user (id, role, name, company_id) is exposed to components.
5. **Socket.io client** — is `socket.io-client` already installed and a shared socket instance available? Where?
6. **UI library** — Tailwind + shadcn/ui? MUI? Ant Design? Chakra? Which components exist (Button, Dialog, Toast, Table, Skeleton)?
7. **Form library** — react-hook-form + zod? Formik? Native forms?
8. **Toast/notification** — which library is used for success/error notifications.
9. **Layout shell** — where is the main authenticated layout (sidebar, header) so we add a "Support" nav item.
10. **i18n** — is the app internationalized? If yes, how strings are added.

---

## Phase 1 — Environment & shared modules

### 1.1 Environment variables

Add to `.env`:

```
NEXT_PUBLIC_API_URL=https://server.stafftimetrack.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://server.stafftimetrack.com
```

Adapt names to the existing convention (e.g. `VITE_*` for Vite, no `NEXT_PUBLIC_*` prefix if not Next.js).

### 1.2 Shared TypeScript enums / constants

Create `src/features/support/types.ts` (adapt path to repo layout):

```ts
export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'pending_customer'
  | 'resolved'
  | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type TicketCategory =
  | 'timer_issue'
  | 'manual_entry'
  | 'calendar_sync'
  | 'billing_invoice'
  | 'integration'
  | 'desktop_app'
  | 'general_inquiry';

export type TicketMessageRole = 'user' | 'agent';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  pending_customer: 'Waiting on you',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'blue',
  in_progress: 'amber',
  pending_customer: 'orange',
  resolved: 'green',
  closed: 'slate',
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  timer_issue: 'Timer issue',
  manual_entry: 'Manual entry',
  calendar_sync: 'Calendar sync',
  billing_invoice: 'Billing / Invoice',
  integration: 'Integration',
  desktop_app: 'Desktop app',
  general_inquiry: 'General inquiry',
};
```

### 1.3 Response envelope

Every backend response follows this shape:

```ts
type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  data: T;
  message: string;
  meta?: { page: number; limit: number; total: number; totalPages: number };
};

type ApiError = {
  success: false;
  message: string;
  errorMessages: { path: string; message: string }[];
};
```

Reuse the existing HTTP wrapper that unwraps `data` and throws on non-2xx.

---

## Phase 2 — API contract (endpoints this dashboard consumes)

All endpoints are behind JWT auth. Base URL: `/api/v1`.

### 2.1 Create ticket
`POST /tickets`

Request body:
```ts
{
  title: string;                    // 3–200 chars, required
  description: string;              // 10–5000 chars, required
  category?: TicketCategory;        // default: general_inquiry
  priority?: TicketPriority;        // default: medium
  affected_time_entry_id?: number;  // optional — see 2.1a
  affected_project?: string;
  client_logs?: string[];           // ≤ 50 lines, each ≤ 2000 chars
  device_info?: { os?: string; app_version?: string; [key: string]: unknown };
  attachments?: string[];           // ≤ 10 URLs, must be from configured base URL
}
```

Response `201`:
```ts
{
  id: number;
  ticket_number: number;     // sequential
  display_number: string;    // "TKT-000123"
  status: 'open';
  priority: TicketPriority;
  category: TicketCategory;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  requester_id: number;
  assigned_agent_id: number | null;
  first_response_at: null;
  resolved_at: null;
  closed_at: null;
  resolution_time_minutes: null;
  reopen_count: 0;
  affected_time_entry_id: number | null;
  affected_project: string | null;
  client_logs: string[];
  device_info: object | null;
}
```

Rate limit: **20 tickets/day/user**. On 429, show "Ticket creation limit reached. Try again tomorrow."

#### 2.1a — About `affected_time_entry_id`

If the user creates a ticket from a specific time entry (e.g. "this entry looks wrong"), pass its id. Backend verifies the entry exists and belongs to the requester; otherwise 400.

If not applicable, omit the field.

#### 2.1b — About `attachments`

Backend accepts URL strings only. This dashboard does NOT upload directly — reuse the existing app upload flow (`POST /leaves/document-upload-url` pattern or similar S3 presigned URL endpoint) to get a URL, then paste that URL into `attachments`.

Backend rejects URLs that don't start with the configured `SUPPORT_ATTACHMENTS_BASE_URL` prefix (usually the S3 CDN base). If your existing upload returns a different origin, ask backend team to align.

### 2.2 List own tickets
`GET /tickets?page=1&limit=20&status=...&category=...`

Response `200`:
```ts
{
  success: true,
  data: Array<{
    id: number;
    ticket_number: number;
    display_number: string;
    title: string;
    status: TicketStatus;
    priority: TicketPriority;
    category: TicketCategory;
    created_at: string;
    updated_at: string;
    assignedAgent: { id: number; name: string } | null;
    feedback: { rating: number } | null;
    _count: { conversations: number };
  }>,
  meta: { page, limit, total, totalPages }
}
```

Sort: `created_at desc`. Filters: `status`, `category`.

### 2.3 Ticket detail (own)
`GET /tickets/:id`

Response `200`:
```ts
{
  id: number;
  ticket_number: number;
  display_number: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  created_at: string;
  updated_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  reopen_count: number;
  affected_project: string | null;
  assignedAgent: { id: number; name: string } | null;
  conversations: Array<{
    id: number;
    sender_id: number;
    sender_role: 'user' | 'agent';
    message: string;
    attachments: string[];
    // is_private rows are FILTERED OUT for non-support callers — you will never see one.
    created_at: string;
    sender: { id: number; name: string };
  }>;
  feedback: { id: number; rating: number; comment: string | null; created_at: string } | null;
}
```

**404** if the ticket doesn't exist OR doesn't belong to the user (anti-enumeration — don't leak existence).

### 2.4 Post reply
`POST /tickets/:id/conversations`

Request:
```ts
{
  message: string;         // 1–5000 chars
  attachments?: string[];  // ≤ 10 URLs, same base-URL rule
  // is_private is IGNORED here for regular users (403 if set true).
}
```

Response `201`: same shape as one `conversations[]` item above.

Errors:
- **409 `{ code: 'TICKET_CLOSED' }`** — ticket is closed. Show: "This ticket is closed. Open a new ticket."
- **404** — ticket not found / not yours.
- **429** — rate limited (60/hour).

Side effects the frontend should render immediately (optimistically):
- If ticket status was `pending_customer` → will auto-flip to `in_progress` after this reply.
- If ticket status was `resolved` → will REOPEN to `in_progress`. Show a warning before submitting: "This ticket is resolved. Replying will reopen it. Continue?"

### 2.5 Submit feedback
`POST /tickets/:id/feedback`

Request:
```ts
{
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;  // ≤ 2000 chars
}
```

Response `201`:
```ts
{ id: number; ticket_id: number; rating: number; comment: string | null; created_at: string; }
```

Errors:
- **409 `{ code: 'INVALID_STATE' }`** — ticket must be `resolved` or `closed`. Hide the feedback form otherwise.
- **409 `{ code: 'FEEDBACK_EXISTS' }`** — already submitted. Show existing rating read-only.
- **404** — ticket not found / not yours.
- **429** — rate limited (5/hour).

**Only ONE feedback per ticket** — enforced by DB unique constraint. After submission, hide the form and show the submitted rating.

---

## Phase 3 — Socket.io realtime

Reuse the existing shared socket instance. The backend already authenticates the same JWT on the socket handshake.

### 3.1 Rooms this dashboard cares about

- `user:{userId}` — auto-joined by the server on connect. Public-agent-reply notifications land here (for tickets NOT currently open in the UI).
- `ticket:{ticketId}` — join when the user opens a specific ticket detail page. Leave on unmount.

### 3.2 Joining a ticket room

When entering `/support/tickets/:id`:

```ts
socket.emit('join:ticket', { ticket_id: Number(id) }, (ack) => {
  if (!ack?.ok) {
    // ack.error is 'not_found' | 'invalid_ticket_id' | 'server_error'
    // Fall back to polling / show a soft warning; do NOT block the UI.
  }
});

// On unmount:
socket.emit('leave:ticket', { ticket_id: Number(id) });
```

### 3.3 Events to listen to

| Event | When | Payload | UI action |
|---|---|---|---|
| `ticket:message` | New public reply on a ticket you joined | `{ id, sender_id, sender_role, message, attachments, created_at, sender: { id, name } }` | Append to the conversation thread. If received via `user:{userId}` room (ticket detail not open), show a toast "New reply on TKT-000123" with a click-through. |
| `ticket:status_changed` | Status transitioned | `{ ticket_id, from, to }` | Update the ticket detail header status badge. If the ticket is `resolved` → show the feedback prompt. |
| `ticket:assigned` | Agent assigned/unassigned | `{ ticket_id, agent: { id, name } \| null }` | Update the "Assigned to" line on the detail page. |

**Private notes are NEVER emitted to this dashboard.** The backend filters them at the socket layer.

### 3.4 Reconnection

After reconnect, re-emit `join:ticket` for the currently open ticket. React Query / SWR should refetch the detail query on `socket.on('connect')` to catch anything missed offline.

---

## Phase 4 — Pages / routes

Add a top-level "Support" section to the sidebar. Suggested routes:

```
/support/tickets               — list (default page)
/support/tickets/new           — create form
/support/tickets/:id           — detail with thread
```

Adapt paths to the existing routing style.

### 4.1 `/support/tickets` — Ticket list

**Layout:**
- Page header: "My Support Tickets" + primary CTA "Create ticket" → `/support/tickets/new`
- Filter bar: status dropdown (multi or single per your UI norm), category dropdown, search-by-text (client-side is fine at MVP).
- Empty state: illustration + "You haven't created any tickets yet" + CTA.
- Table / card list per row:
  - `display_number` (TKT-000123) + status badge (color-coded per `STATUS_COLORS`)
  - Title (truncate at 60 chars)
  - Category label + priority indicator
  - Assigned agent avatar + name (or "Unassigned")
  - Message count icon + `_count.conversations`
  - Rating stars if `feedback` present
  - Relative time: `created_at` (e.g. "3 days ago")
- Pagination: bottom, standard.
- Loading state: skeleton rows.
- Error state: retry button.

Query key suggestion (React Query): `['support', 'tickets', { page, limit, status, category }]`.

### 4.2 `/support/tickets/new` — Create form

Fields:
- **Title** (required, 3–200 chars)
- **Category** (dropdown, default `general_inquiry`, labels from `CATEGORY_LABELS`)
- **Priority** (radio or dropdown: low / medium / high / critical, default `medium`)
- **Description** (multiline textarea, 10–5000 chars, show character counter after 4500)
- **Affected project** (optional text; if you have a project picker in the codebase, reuse it and store the project name)
- **Affected time entry** (optional; if the user landed here from a time entry page, prefill this from the query string)
- **Attachments** — reuse the existing S3 upload widget; store returned URLs in an array. Cap at 10.
- Submit button: disabled until form is valid.

Client-side validation must mirror backend rules (use zod schema — same shape as backend `createTicketSchema`).

On success:
- Toast: "Ticket created — TKT-000123"
- Navigate to `/support/tickets/:id` (the newly created ticket)

### 4.3 `/support/tickets/:id` — Ticket detail

**Layout:**
- Sticky header:
  - Back button → `/support/tickets`
  - `display_number` + status badge + priority badge
  - Title (editable? NO — user cannot edit after creation)
  - Meta line: category · created X ago · assigned to Y (or "Not assigned yet")
  - `reopen_count > 0` → small "Reopened X times" chip
- Left/main column — Conversation thread:
  - Timeline of messages ordered ascending by `created_at`.
  - Distinct bubble style per `sender_role` (user right-aligned, agent left-aligned).
  - Message header: sender name + relative time. Attachments render as file chips with a preview link.
  - **First response indicator**: if `first_response_at` is set, show a small "First response: X minutes" chip somewhere in the header.
- Right column / bottom card — Actions:
  - If status ≠ `closed`:
    - Reply composer: textarea + attachment picker + Send button.
    - If status = `resolved`: composer shows warning "Replying will reopen this ticket."
  - If status = `resolved` or `closed` AND `feedback === null`:
    - Feedback form: 5 stars + optional comment + Submit.
  - If `feedback !== null`:
    - Read-only submitted rating with comment.
  - If status = `closed`: composer replaced with "This ticket is closed. Create a new ticket if the issue returns."

**Realtime behavior:**
- Join the ticket room on mount. Leave on unmount.
- On `ticket:message` (public only): append to the thread. If the sender is not the current user, play a subtle notification sound (optional).
- On `ticket:status_changed`: update the header badge. If new status is `resolved` and no feedback yet, scroll/highlight the feedback form.
- On `ticket:assigned`: update the meta line.

---

## Phase 5 — UX rules

1. **Empty and loading states matter.** Never render `undefined` badges or `NaN` counters.
2. **Confirmation before destructive actions.**
   - Replying to a `resolved` ticket → "Replying will reopen this ticket. Continue?"
3. **Optimistic updates for messages.** When the user hits Send, insert the message locally with a "sending…" indicator, then reconcile with the server response. Roll back on error.
4. **Attachment previews.** For image URLs, thumbnail. For other MIME types, filename + download icon.
5. **Timezone.** Render `created_at` etc. in the user's local timezone (use the existing timezone helper if present in the codebase).
6. **Accessibility.**
   - Star rating: keyboard navigable (arrow keys + Enter/Space to set).
   - Toasts: `role="status"`, live regions.
   - Focus management: return focus to composer after send; move focus to the newly created ticket on redirect.
7. **Long messages.** Word-break on very long unbroken strings (URLs, logs). Preserve newlines in message rendering — treat as pre-wrap, but escape HTML.
8. **Do NOT render `is_private` messages.** The backend filters them; but as belt-and-suspenders, ignore any conversation row where `is_private === true`.

---

## Phase 6 — Error handling

| HTTP | Meaning | User-facing action |
|---|---|---|
| 400 | Validation error | Show inline field errors from `errorMessages[]` |
| 401 | Auth expired | Trigger the existing sign-out / refresh flow |
| 403 | Forbidden | Toast: "You don't have permission for this action" |
| 404 | Ticket not found | List page: show empty state. Detail page: redirect to list with toast "Ticket not found". |
| 409 | State conflict | Look at `errorMessages[0].message` — special codes: `TICKET_CLOSED`, `INVALID_STATE`, `FEEDBACK_EXISTS`. Handle each per Phase 2. |
| 422 | Not applicable to user endpoints | — |
| 429 | Rate limited | Read `Retry-After` header if present; show the backend `message` in a toast. |
| 5xx | Server error | Toast "Something went wrong. Please try again." + retry button. |

---

## Phase 7 — Testing checklist (agent should verify each)

- [ ] User can create a ticket; response has `display_number`; redirected to detail.
- [ ] The 20/day limit surfaces a friendly toast without breaking the form.
- [ ] Ticket list paginates and filters by status + category.
- [ ] Detail page loads all messages in chronological order.
- [ ] Sending a reply appears in the thread immediately (optimistic).
- [ ] Another browser tab logged in as the same user, on the same ticket, receives the new message via socket.
- [ ] Replying to a `resolved` ticket shows the confirmation prompt.
- [ ] Feedback form only appears on `resolved`/`closed` tickets without existing feedback.
- [ ] Submitting rating 5 hides the form and shows the read-only rating.
- [ ] Trying to submit feedback twice surfaces "already submitted" cleanly.
- [ ] Visiting `/support/tickets/999999999` (nonexistent) shows a graceful 404 state, no crash.
- [ ] Reconnect after network drop refetches the current ticket and re-joins the room.
- [ ] All strings render in the user's timezone.
- [ ] Screen reader announces new messages via live region.

---

## Out of scope for this dashboard

- Support agent queue view / assignment / private notes → separate agent dashboard spec.
- Analytics dashboards → super admin dashboard spec.
- File uploads (reuse existing upload flow; this feature stores URLs only).
