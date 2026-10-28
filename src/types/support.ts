/**
 * Support (ticket) types for the requester portal.
 *
 * Shapes follow the step-2 API as BUILT (backend
 * `src/app/modules/Support/core/dto.ts`, blueprint §8.2/§8.3). The API still
 * sends the v1 keys of the §8.7 compatibility window (`assignedAgent`,
 * `_count.conversations`, `conversations[]`, the message `sender_*` keys)
 * next to the v2 ones; they are not modelled — the narrowing schemas are
 * loose, so they pass through untyped and nothing reads or writes them.
 * Labels live in `components/Support/primitives/tokens.ts` (built on the
 * `*_LABELS` maps below).
 */

/* ───────────────────────────── enums (§4) ───────────────────────────── */

export type TicketStatus =
  | "open"
  | "in_progress"
  | "pending_customer"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "critical";

/**
 * The seven seeded category slugs (§4.3). Categories are owner-managed rows
 * since step 1, so the API may return a slug outside this union — read
 * `category_ref` for name/icon/colour and treat `category` as
 * `TicketCategorySlug`.
 */
export type TicketCategory =
  | "timer_issue"
  | "manual_entry"
  | "calendar_sync"
  | "billing_invoice"
  | "integration"
  | "desktop_app"
  | "general_inquiry";

/** A seeded slug or any owner-created one. */
export type TicketCategorySlug = TicketCategory | (string & {});

export type TicketMessageKind = "reply" | "note";

/** `SupportCategory.icon` (prisma `SupportCategoryIcon`). */
export type SupportCategoryIcon =
  | "monitor"
  | "stopwatch"
  | "plug"
  | "receipt"
  | "calendar"
  | "envelope"
  | "question"
  | "pencil"
  | "calendar_sync";

export type TicketSource = "web_form" | "desktop_app" | "email" | "api";

export type TicketClosedReason = "auto_close" | "manual";

/** Feedback highlight chips (§4.4; stored as these keys). */
export type FeedbackHighlight =
  | "quick_response"
  | "solved_my_issue"
  | "friendly"
  | "clear_explanation"
  | "knowledgeable";

export const TICKET_STATUS_VALUES: TicketStatus[] = [
  "open",
  "in_progress",
  "pending_customer",
  "resolved",
  "closed",
];

export const TICKET_PRIORITY_VALUES: TicketPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

export const SUPPORT_CATEGORY_ICON_VALUES: SupportCategoryIcon[] = [
  "monitor",
  "stopwatch",
  "plug",
  "receipt",
  "calendar",
  "envelope",
  "question",
  "pencil",
  "calendar_sync",
];

export const FEEDBACK_HIGHLIGHT_VALUES: FeedbackHighlight[] = [
  "quick_response",
  "solved_my_issue",
  "friendly",
  "clear_explanation",
  "knowledgeable",
];

export const FEEDBACK_HIGHLIGHT_LABELS: Record<FeedbackHighlight, string> = {
  quick_response: "Quick response",
  solved_my_issue: "Solved my issue",
  friendly: "Friendly",
  clear_explanation: "Clear explanation",
  knowledgeable: "Knowledgeable",
};

/** A star rating (§4.4). */
export type Rating = 1 | 2 | 3 | 4 | 5;

export const RATING_VALUES: readonly Rating[] = [1, 2, 3, 4, 5];

/** Verbal grade per star count (§4.4 "5 = Excellent"). */
export const RATING_GRADES: Record<Rating, string> = {
  5: "Excellent",
  4: "Good",
  3: "Okay",
  2: "Poor",
  1: "Bad",
};

/** Any number → the nearest star count (the one place a number becomes a `Rating`). */
export const toRating = (value: number): Rating =>
  Math.min(5, Math.max(1, Math.round(Number.isFinite(value) ? value : 1))) as Rating;

/** "Excellent" for 4.6, "Bad" for 1 — the grade of the nearest star count. */
export const ratingGrade = (value: number): string => RATING_GRADES[toRating(value)];

/* ───────────────────────────── label maps ───────────────────────────── */

/** Requester labels (§4.1): `pending_customer` reads "Waiting on you" here. */
export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  pending_customer: "Waiting on you",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/**
 * Seeded category names. Index with any slug: an owner-created category is
 * `undefined` here — prefer `category_ref.name`, fall back to this, then to
 * the slug itself.
 */
export const CATEGORY_LABELS: Record<TicketCategory, string> &
  Partial<Record<string, string>> = {
  timer_issue: "Timer issue",
  manual_entry: "Manual entry",
  calendar_sync: "Calendar sync",
  billing_invoice: "Billing / Invoice",
  integration: "Integration",
  desktop_app: "Desktop app",
  general_inquiry: "General inquiry",
};

/* ───────────────────────────── shared refs ───────────────────────────── */

export interface UserRef {
  id: number;
  name: string;
  image: string | null;
}

/**
 * The `ticket:assigned` socket `agent` shape. `name` is nullable because the
 * payload may carry a null name; a `UserRef` is assignable.
 */
export interface TicketAgent {
  id: number;
  name: string | null;
  image?: string | null;
}

/** `category_ref` on every ticket DTO and a `GET /tickets/categories` row. */
export interface CategoryRef {
  id: number;
  slug: TicketCategorySlug;
  name: string;
  icon: SupportCategoryIcon;
  color: string;
}

/** `GET /tickets/categories` row (visible categories in `sort_order`). */
export interface SupportCategory extends CategoryRef {
  sort_order?: number;
  is_default?: boolean;
  is_visible?: boolean;
}

/* ───────────────────────────── attachments ───────────────────────────── */

/** §8.2 AttachmentDTO: a stored file with a 15-minute signed `download_url`. */
export interface AttachmentDTO {
  id: number;
  file_name: string;
  mime_type: string | null;
  byte_size: number | null;
  is_image: boolean;
  width: number | null;
  height: number | null;
  /** 15-min signed GET; null when signing failed — refetch the ticket for a fresh one. */
  download_url: string | null;
  expires_in?: number | null;
  uploaded_by: { id: number; name: string } | null;
  created_at: string;
  message_id?: number | null;
  ticket_id?: number | null;
  is_internal?: boolean;
}

/**
 * One row of `POST /tickets/attachments` → `data[]`: the AttachmentDTO of the
 * pending row plus the v1 keys (`key` is what the v1 create/reply bodies send,
 * `id` is what the v2 `attachment_ids[]` send).
 */
export interface UploadedAttachment extends AttachmentDTO {
  key: string;
  name: string;
  size: number;
  content_type: string;
  /** Short-lived signed preview URL (null when signing failed). */
  url: string | null;
}

/* ───────────────────────────── messages / timeline ───────────────────────────── */

export interface MessageAuthor {
  id: number | null;
  name: string | null;
  image: string | null;
  role: "requester" | "agent";
}

/** §8.2 MessageDTO as the requester sees it (never a note). */
export interface MessageDTO {
  id: number;
  ticket_id: number;
  kind: TicketMessageKind;
  author: MessageAuthor;
  body: string;
  /** v1 shape: signed URLs whose path carries the object key. */
  attachments: string[];
  files: AttachmentDTO[];
  mentions: UserRef[];
  then_status: TicketStatus | null;
  created_at: string;
  edited_at: string | null;
  seen_by_requester: boolean;
  deleted_at?: string | null;
}

/** `POST /tickets/:id/messages` → `data.message` and the `ticket:message` socket payload. */
export interface PostedMessage extends MessageDTO {
  saved_reply_id?: number | null;
}

export interface TimelineEventActor extends UserRef {
  exists: boolean;
}

export interface TimelineEvent {
  id: number;
  /** `TICKET_CREATED`, `STATUS_CHANGED`, `TICKET_ASSIGNED`, `TICKET_REOPENED`, `FEEDBACK_SUBMITTED`, `TICKET_UPDATED` … */
  action: string;
  actor: TimelineEventActor | "system";
  changes: unknown;
  at: string;
  visibility: string;
}

export type TimelineItem =
  | { type: "message"; at: string; message: MessageDTO }
  | { type: "event"; at: string; event: TimelineEvent };

/** Keyset paging of the thread (`?before=`). */
export interface ThreadPage {
  page_size: number;
  has_more: boolean;
  next_before: number | null;
}

/* ───────────────────────────── feedback ───────────────────────────── */

/** Ticket feedback as embedded on the detail (and the v1 shape with `id`). */
export interface TicketFeedback {
  id?: number;
  rating: number;
  highlights?: string[];
  comment: string | null;
  created_at: string;
  rated_agent?: UserRef | null;
}

/* ───────────────────────────── tickets ───────────────────────────── */

/** `GET /tickets` row — §8.2 TicketRequesterSummary. */
export interface TicketRequesterSummary {
  id: number;
  display_number: string;
  ticket_number: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  /** slug (v1 key) — read `category_ref` for the name/icon/colour */
  category: TicketCategorySlug;
  category_id: number | null;
  category_ref: CategoryRef | null;
  created_at: string;
  updated_at: string;
  public_message_count: number;
  rating: number | null;
  agent: UserRef | null;
  /** status === pending_customer: the purple row accent (REQ-U-12) */
  needs_requester_reply: boolean;
  /** the live reply target, or null (resolved/closed/paused) */
  expected_reply_by: string | null;
  last_message_at: string | null;
  /** present unless `fields=minimal` */
  description?: string;
}

/** `GET /tickets/:id` — §8.2 TicketRequesterDetail. */
export interface TicketRequesterDetail extends Omit<TicketRequesterSummary, "description"> {
  description: string;
  affected_time_entry_id: number | null;
  affected_project: string | null;
  /** replies and public events only, oldest first (the loaded page) */
  timeline: TimelineItem[];
  thread: ThreadPage;
  /** v1 shape: signed URLs of the creation attachments */
  attachments: string[];
  /** every non-internal file of the ticket */
  files: AttachmentDTO[];
  feedback: TicketFeedback | null;
  feedback_enabled: boolean;
  rate_later_enabled: boolean;
  can_reply: boolean;
  can_rate: boolean;
  closed_at: string | null;
  closed_reason: TicketClosedReason | null;
  reopened_from_id: number | null;
  resolved_at: string | null;
  first_response_at: string | null;
  reopen_count: number;
  source: TicketSource;
  company_id: number;
  requester_id: number | null;
  requester_name: string | null;
}

/** `GET /tickets/counts` — the hero card and the status dropdown counts. */
export interface TicketCounts {
  open: number;
  in_progress: number;
  pending_customer: number;
  resolved: number;
  closed: number;
  total: number;
}

/**
 * The "ticket patch" returned next to a posted message (backend
 * `toTicketPatch`): the fields a reply may have changed. Everything is
 * optional except the identity and status, so callers merge it over the
 * detail they hold (`postMessageResultSchema` narrows every key).
 */
export interface TicketPatch extends Partial<Omit<TicketRequesterSummary, "description">> {
  id: number;
  status: TicketStatus;
  updated_at: string;
  can_reply?: boolean;
  can_rate?: boolean;
  feedback_enabled?: boolean;
  rate_later_enabled?: boolean;
  first_response_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  closed_reason?: TicketClosedReason | null;
  reopened_from_id?: number | null;
  reopen_count?: number;
}

export interface PostMessageToast {
  title: string;
  body: string | null;
}

/** `POST /tickets/:id/messages` → `data`. */
export interface PostMessageResult {
  message: PostedMessage;
  ticket: TicketPatch;
  toast: PostMessageToast;
}

/**
 * `POST /tickets/:id/reopen-as-new` → `data`: the prefilled create draft.
 * Only a CLOSED ticket qualifies (live API: 409 INVALID_STATE "Only a
 * closed ticket can be reopened as a new ticket" otherwise).
 */
export interface ReopenDraft {
  title: string;
  category_id: number | null;
  category: TicketCategorySlug;
  reopened_from_id: number;
  reopened_from_display_number: string;
}

/** `POST /tickets/:id/feedback` → `data` (the created feedback row). */
export interface FeedbackResult extends TicketFeedback {
  id?: number;
  ticket_id?: number;
  rated_agent_id?: number | null;
}

/** `GET /tickets/attachments/url?key=` → `data`. */
export interface AttachmentUrlResult {
  key: string;
  url: string;
  expires_in: number;
}

/* ───────────────────────────── request payloads ───────────────────────────── */

export interface CreateTicketPayload {
  title: string;
  description: string;
  /** v2 — preferred; from `GET /tickets/categories` */
  category_id?: number;
  /** v1 alias — a slug; the API resolves it (400 when unknown/hidden) */
  category?: TicketCategorySlug;
  priority?: TicketPriority;
  /** v2 — ids of pending rows from `POST /tickets/attachments` */
  attachment_ids?: number[];
  /** v1 alias — object keys from the same upload response */
  attachments?: string[];
  affected_project?: string;
  affected_time_entry_id?: number;
  client_logs?: string[];
  device_info?: Record<string, string | number | boolean | null>;
  /** from `POST /tickets/:id/reopen-as-new` */
  reopened_from_id?: number;
}

/** `POST /tickets/:id/messages` body — text or files, at least one. */
export interface PostMessagePayload {
  body?: string;
  attachment_ids?: number[];
}

export interface SubmitFeedbackPayload {
  rating: Rating;
  highlights?: FeedbackHighlight[];
  comment?: string;
}

export interface MarkReadPayload {
  last_read_message_id: number;
}

/** `GET /tickets` query (v2 names; the API also accepts the v1 `category` slug). */
export interface TicketListFilters {
  page?: number;
  /** default 5 as drawn (REQ-U-06); max 100 */
  limit?: number;
  status?: TicketStatus;
  /** v1 slug filter */
  category?: TicketCategorySlug;
  /** v2 id filter (preferred when the category list is loaded) */
  category_id?: number;
  /** number (`TKT-000024`, `24`, `#24`) or title text, ≤ 200 chars */
  q?: string;
  sort?: "created_at" | "updated_at";
  dir?: "asc" | "desc";
  fields?: "minimal";
}

/* ───────────────────────────── socket events (default namespace) ───────────────────────────── */

/** Keys every ticket-level payload carries (v1 `ticket_id` + §9.3 `id`/`display_number`). */
export interface TicketEventIds {
  ticket_id?: number;
  id?: number;
  ticket_number?: number;
  display_number?: string;
}

export type SocketActor =
  /** `kind` (`requester` / `agent` / `owner`) is sent on the `/support` namespace when the writer knows it */
  | { id: number | null; name?: string | null; image?: string | null; kind?: string }
  | number
  | "system"
  | null;

/**
 * `ticket:message` — the PostedMessage (its `id` is the MESSAGE id;
 * `ticket_id` names the ticket). Only public replies ever reach a requester.
 */
export interface TicketMessageEvent extends PostedMessage {
  display_number?: string;
}

/** `ticket:status_changed` — v1 `{ ticket_id, from, to }` + §9.3 keys. */
export interface TicketStatusChangedEvent extends TicketEventIds {
  ticket_id: number;
  from: TicketStatus;
  to: TicketStatus;
  actor?: SocketActor;
  at?: string;
  reopen_count?: number;
  /** what moved it (`requester_reply`, `first_reply`, `auto_close` …) — default namespace only; `/support` omits it */
  trigger?: string;
}

/** `ticket:assigned` — v1 `{ ticket_id, agent }` + §9.3 keys. */
export interface TicketAssignedEvent extends TicketEventIds {
  ticket_id: number;
  agent: TicketAgent | null;
  assignee?: TicketAgent | null;
  previous_assignee_id?: number | null;
  assigned_at?: string | null;
  reason?: string | null;
}

/** `ticket:feedback` — v1 `{ ticket_id, rating }` + §9.3 keys. */
export interface TicketFeedbackEvent extends TicketEventIds {
  ticket_id: number;
  rating: number;
  highlights?: string[];
  comment_present?: boolean;
  rated_agent_id?: number | null;
}

/**
 * `ticket:updated` — priority / category / title edits by staff (§5.5). `changes` is narrowed at
 * the socket boundary: a pair is present only when its `to` is a valid value (an unknown priority
 * from a newer backend is dropped, never handed to the UI).
 */
export interface TicketUpdatedEvent extends TicketEventIds {
  ticket_id: number;
  changes: {
    priority?: { from: TicketPriority | null; to: TicketPriority };
    /** a slug (v2 events) or an id (older payloads) */
    category?: { from: string | number | null; to: string | number };
    category_id?: { from: number | null; to: number };
    title?: { from: string | null; to: string };
  };
  updated_at: string;
  actor?: SocketActor;
}

/** `ticket:new` — a ticket the requester created (reaches `user:<id>` only via platform rooms today). */
export interface TicketNewEvent extends TicketEventIds {
  id: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  category?: string | null;
  category_ref?: Partial<CategoryRef> | null;
}

export interface SupportSocketEventMap {
  "ticket:new": TicketNewEvent;
  "ticket:message": TicketMessageEvent;
  "ticket:status_changed": TicketStatusChangedEvent;
  "ticket:assigned": TicketAssignedEvent;
  "ticket:feedback": TicketFeedbackEvent;
  "ticket:updated": TicketUpdatedEvent;
}

export type SupportSocketEventName = keyof SupportSocketEventMap;

export const SUPPORT_SOCKET_EVENTS: SupportSocketEventName[] = [
  "ticket:new",
  "ticket:message",
  "ticket:status_changed",
  "ticket:assigned",
  "ticket:feedback",
  "ticket:updated",
];
