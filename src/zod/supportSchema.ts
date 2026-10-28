import { z } from "zod";
import type {
  AttachmentUrlResult,
  FeedbackResult,
  PostMessageResult,
  PostedMessage,
  ReopenDraft,
  SupportCategory,
  TicketCounts,
  TicketPriority,
  TicketRequesterDetail,
  TicketRequesterSummary,
  TicketStatus,
  UploadedAttachment,
} from "@/types/support";
import {
  FEEDBACK_HIGHLIGHT_VALUES,
  SUPPORT_CATEGORY_ICON_VALUES,
  TICKET_PRIORITY_VALUES,
  TICKET_STATUS_VALUES,
} from "@/types/support";
import type { IMeta } from "@/types/type";

/**
 * Two kinds of schema live here.
 *
 * 1. FORM schemas (`newTicketSchema`, `replySchema`, `feedbackSchema`):
 *    the boundary between what the user typed and what the API accepts. The
 *    limits mirror the backend's `ticket.validation.ts` (§17.2 item 9); the
 *    server stays the authority. No `.default()` / `.transform()` on these so
 *    `z.infer` is both the input and the output type react-hook-form sees.
 *
 * 2. RESPONSE narrowing schemas (`narrowTicketList`, …): every payload the
 *    client reads from the API is narrowed before use. Identity fields are
 *    strict; presentational ones are tolerant (`.catch`) so a nullable the
 *    backend relaxes later degrades to a sensible default instead of taking
 *    the page down. Objects are loose: keys we do not model (the §8.7 v1
 *    mirrors among them) pass through untyped and are never read.
 */

/* ───────────────────────────── limits ───────────────────────────── */

export const SUPPORT_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 200,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 10_000,
  MESSAGE_MAX: 10_000,
  COMMENT_MAX: 2_000,
  ATTACHMENTS_MAX: 10,
  HIGHLIGHTS_MAX: 5,
  SEARCH_MAX: 200,
  AFFECTED_PROJECT_MAX: 200,
  LIST_LIMIT_DEFAULT: 5,
  LIST_LIMIT_MAX: 100,
  LIST_PAGE_MAX: 1000,
} as const;

/* ───────────────────────────── enums ───────────────────────────── */

const statusTuple = TICKET_STATUS_VALUES as [TicketStatus, ...TicketStatus[]];
const priorityTuple = TICKET_PRIORITY_VALUES as [
  TicketPriority,
  ...TicketPriority[],
];

export const ticketStatusSchema = z.enum(statusTuple);
export const ticketPrioritySchema = z.enum(priorityTuple);
export const feedbackHighlightSchema = z.enum(
  FEEDBACK_HIGHLIGHT_VALUES as [
    (typeof FEEDBACK_HIGHLIGHT_VALUES)[number],
    ...(typeof FEEDBACK_HIGHLIGHT_VALUES)[number][],
  ],
);

/** Category slug as the API validates it (lowercase, `[a-z0-9][a-z0-9_-]*`). */
export const categorySlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9][a-z0-9_-]*$/i);

/* ───────────────────────────── form schemas ───────────────────────────── */

const attachmentIdSchema = z.number().int().positive();

export const newTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(SUPPORT_LIMITS.TITLE_MIN, "Title must be at least 3 characters")
    .max(SUPPORT_LIMITS.TITLE_MAX, "Title must be at most 200 characters"),
  description: z
    .string()
    .trim()
    .min(
      SUPPORT_LIMITS.DESCRIPTION_MIN,
      "Description must be at least 10 characters",
    )
    .max(
      SUPPORT_LIMITS.DESCRIPTION_MAX,
      "Description must be at most 10,000 characters",
    ),
  /** From `GET /tickets/categories`; the modal keeps the id, never the label. */
  category_id: z
    .number({ error: "Choose a category" })
    .int()
    .positive("Choose a category"),
  priority: ticketPrioritySchema,
  /** ids of the pending rows minted by the upload endpoint */
  attachment_ids: z
    .array(attachmentIdSchema)
    .max(SUPPORT_LIMITS.ATTACHMENTS_MAX, "Up to 10 attachments allowed"),
  affected_project: z
    .string()
    .trim()
    .max(SUPPORT_LIMITS.AFFECTED_PROJECT_MAX, "Must be at most 200 characters")
    .optional(),
  /** set when the draft came from `POST /tickets/:id/reopen-as-new` */
  reopened_from_id: z.number().int().positive().optional(),
});

/** Values of the step-9 create modal (`category_id` + `attachment_ids`). */
export type NewTicketFormValues = z.infer<typeof newTicketSchema>;

/** `POST /tickets/:id/messages`: text or files — at least one of them. */
export const replySchema = z
  .object({
    body: z
      .string()
      .trim()
      .max(SUPPORT_LIMITS.MESSAGE_MAX, "Message must be at most 10,000 characters"),
    attachment_ids: z
      .array(attachmentIdSchema)
      .max(SUPPORT_LIMITS.ATTACHMENTS_MAX, "Up to 10 attachments allowed"),
  })
  .refine((value) => value.body.length > 0 || value.attachment_ids.length > 0, {
    error: "Write a message or attach at least one file",
    path: ["body"],
  });

export type ReplyFormValues = z.infer<typeof replySchema>;

export const feedbackSchema = z.object({
  rating: z
    .number({ error: "Please select a rating" })
    .int()
    .min(1, "Please select a rating")
    .max(5, "Rating must be between 1 and 5"),
  highlights: z
    .array(feedbackHighlightSchema)
    .max(SUPPORT_LIMITS.HIGHLIGHTS_MAX, "Pick up to 5 highlights")
    .optional(),
  comment: z
    .string()
    .trim()
    .max(SUPPORT_LIMITS.COMMENT_MAX, "Comment must be at most 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type FeedbackFormValues = z.infer<typeof feedbackSchema>;

/** The list page's URL/search state, as the list author parses `searchParams`. */
export const ticketListFiltersSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(SUPPORT_LIMITS.LIST_PAGE_MAX)
    .catch(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(SUPPORT_LIMITS.LIST_LIMIT_MAX)
    .catch(SUPPORT_LIMITS.LIST_LIMIT_DEFAULT),
  status: ticketStatusSchema.optional().catch(undefined),
  category: categorySlugSchema.optional().catch(undefined),
  category_id: z.coerce.number().int().positive().optional().catch(undefined),
  q: z
    .string()
    .trim()
    .max(SUPPORT_LIMITS.SEARCH_MAX)
    .optional()
    .catch(undefined),
});

/**
 * `/support/tickets/new?title=…&category_id=…&reopened_from_id=…` — the
 * prefill contract between the ticket page's "Open a new ticket" (after
 * `POST /tickets/:id/reopen-as-new`) and the create form. Every field is
 * optional and tolerant: a bad value is dropped, never an error page.
 */
export const newTicketDraftSearchSchema = z.object({
  title: z.string().trim().max(SUPPORT_LIMITS.TITLE_MAX).optional().catch(undefined),
  category_id: z.coerce.number().int().positive().optional().catch(undefined),
  reopened_from_id: z.coerce.number().int().positive().optional().catch(undefined),
  reopened_from_display_number: z
    .string()
    .trim()
    .regex(/^TKT-\d{6,}$/)
    .optional()
    .catch(undefined),
});

export type NewTicketDraft = z.infer<typeof newTicketDraftSearchSchema>;

/* ───────────────────────────── response schemas ───────────────────────────── */

const isoString = z.string().min(1);
const nullableString = z.string().nullable().catch(null);
const nullableNumber = z.number().nullable().catch(null);

export const metaSchema = z.looseObject({
  page: z.number().int().catch(1),
  limit: z.number().int().catch(SUPPORT_LIMITS.LIST_LIMIT_DEFAULT),
  total: z.number().int().catch(0),
  totalPages: z.number().int().catch(1),
});

export const userRefSchema = z.looseObject({
  id: z.number().int(),
  name: z.string().catch(""),
  image: nullableString,
});

export const categoryRefSchema = z.looseObject({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
  icon: z
    .enum(
      SUPPORT_CATEGORY_ICON_VALUES as [
        (typeof SUPPORT_CATEGORY_ICON_VALUES)[number],
        ...(typeof SUPPORT_CATEGORY_ICON_VALUES)[number][],
      ],
    )
    .catch("question"),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .catch("#FF6900"),
});

export const supportCategorySchema = categoryRefSchema.extend({
  sort_order: z.number().int().optional().catch(undefined),
  is_default: z.boolean().optional().catch(undefined),
  is_visible: z.boolean().optional().catch(undefined),
});

export const countsSchema = z.looseObject({
  open: z.number().int().catch(0),
  in_progress: z.number().int().catch(0),
  pending_customer: z.number().int().catch(0),
  resolved: z.number().int().catch(0),
  closed: z.number().int().catch(0),
  total: z.number().int().catch(0),
});

export const attachmentSchema = z.looseObject({
  id: z.number().int(),
  file_name: z.string().catch("attachment"),
  mime_type: nullableString,
  byte_size: nullableNumber,
  is_image: z.boolean().catch(false),
  width: nullableNumber,
  height: nullableNumber,
  download_url: nullableString,
  expires_in: nullableNumber.optional(),
  uploaded_by: z
    .looseObject({ id: z.number().int(), name: z.string().catch("") })
    .nullable()
    .catch(null),
  created_at: isoString,
  message_id: nullableNumber.optional(),
  ticket_id: nullableNumber.optional(),
  is_internal: z.boolean().optional().catch(undefined),
});

export const uploadedAttachmentSchema = attachmentSchema.extend({
  key: z.string().min(1),
  name: z.string().catch("attachment"),
  size: z.number().catch(0),
  content_type: z.string().catch("application/octet-stream"),
  url: nullableString,
});

const messageAuthorSchema = z.looseObject({
  id: nullableNumber,
  name: nullableString,
  image: nullableString,
  role: z.enum(["requester", "agent"]).catch("agent"),
});

export const messageSchema = z.looseObject({
  id: z.number().int(),
  ticket_id: z.number().int(),
  kind: z.enum(["reply", "note"]).catch("reply"),
  author: messageAuthorSchema,
  body: z.string().catch(""),
  attachments: z.array(z.string()).catch([]),
  files: z.array(attachmentSchema).catch([]),
  mentions: z.array(userRefSchema).catch([]),
  then_status: ticketStatusSchema.nullable().catch(null),
  created_at: isoString,
  edited_at: nullableString,
  seen_by_requester: z.boolean().catch(false),
  deleted_at: nullableString.optional(),
});

/** The posted message (`POST …/messages` answer, `ticket:message` payload). */
export const postedMessageSchema = messageSchema.extend({
  saved_reply_id: nullableNumber.optional(),
});

const timelineEventSchema = z.looseObject({
  id: z.number().int(),
  action: z.string(),
  actor: z
    .union([
      z.literal("system"),
      userRefSchema.extend({ exists: z.boolean().catch(true) }),
    ])
    .catch("system"),
  changes: z.unknown(),
  at: isoString,
  visibility: z.string().catch("public"),
});

export const timelineItemSchema = z.discriminatedUnion("type", [
  z.looseObject({ type: z.literal("message"), at: isoString, message: messageSchema }),
  z.looseObject({ type: z.literal("event"), at: isoString, event: timelineEventSchema }),
]);

const threadPageSchema = z.looseObject({
  page_size: z.number().int().catch(50),
  has_more: z.boolean().catch(false),
  next_before: nullableNumber,
});

export const feedbackSchemaResponse = z.looseObject({
  id: z.number().int().optional(),
  rating: z.number().int().min(1).max(5),
  highlights: z.array(z.string()).catch([]),
  comment: nullableString,
  created_at: isoString,
  rated_agent: userRefSchema.nullable().optional().catch(null),
});

/** `GET /tickets` row (the object part; the detail extends it). */
const ticketSummaryBaseSchema = z.looseObject({
    id: z.number().int(),
    display_number: z.string().min(1),
    ticket_number: z.number().int().catch(0),
    title: z.string(),
    status: ticketStatusSchema,
    priority: ticketPrioritySchema.catch("medium"),
    category: z.string().catch("general_inquiry"),
    category_id: nullableNumber,
    category_ref: categoryRefSchema.nullable().catch(null),
    created_at: isoString,
    updated_at: isoString,
    public_message_count: z.number().int().catch(0),
    rating: z.number().nullable().catch(null),
    agent: userRefSchema.nullable().catch(null),
    needs_requester_reply: z.boolean().optional(),
    expected_reply_by: nullableString,
    last_message_at: nullableString,
    description: z.string().optional(),
});

/** `needs_requester_reply` is derived from the status when an older payload lacks it. */
export const ticketSummarySchema = ticketSummaryBaseSchema.transform((t) => ({
  ...t,
  needs_requester_reply: t.needs_requester_reply ?? t.status === "pending_customer",
}));

export const ticketDetailSchema = ticketSummaryBaseSchema
  .extend({
    description: z.string().catch(""),
    affected_time_entry_id: nullableNumber,
    affected_project: nullableString,
    timeline: z.array(timelineItemSchema).catch([]),
    thread: threadPageSchema.catch({ page_size: 50, has_more: false, next_before: null }),
    attachments: z.array(z.string()).catch([]),
    files: z.array(attachmentSchema).catch([]),
    feedback: feedbackSchemaResponse.nullable().catch(null),
    feedback_enabled: z.boolean().catch(true),
    rate_later_enabled: z.boolean().catch(true),
    can_reply: z.boolean().optional(),
    can_rate: z.boolean().optional(),
    closed_at: nullableString,
    closed_reason: z.enum(["auto_close", "manual"]).nullable().catch(null),
    reopened_from_id: nullableNumber,
    resolved_at: nullableString,
    first_response_at: nullableString,
    reopen_count: z.number().int().catch(0),
    source: z.enum(["web_form", "desktop_app", "email", "api"]).catch("web_form"),
    company_id: z.number().int().catch(0),
    requester_id: nullableNumber,
    requester_name: nullableString,
  })
  .transform((t) => ({
    ...t,
    needs_requester_reply: t.needs_requester_reply ?? t.status === "pending_customer",
    can_reply: t.can_reply ?? t.status !== "closed",
    can_rate:
      t.can_rate ??
      (t.feedback_enabled &&
        (t.status === "resolved" || t.status === "closed") &&
        t.feedback === null),
  }));

/** An optional patch key: a missing OR invalid value becomes `undefined` (dropped by the merge, never defaulted). */
const patchKey = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);

/**
 * The ticket patch next to a posted message (backend `toTicketPatch`, requester view). Every key is
 * checked: identity and status strictly, the rest dropped when invalid — a patch must never write a
 * default (e.g. "medium") over the value the page holds.
 */
export const ticketPatchSchema = z.looseObject({
  id: z.number().int(),
  status: ticketStatusSchema,
  updated_at: isoString.catch(() => new Date().toISOString()),
  display_number: patchKey(z.string().min(1)),
  ticket_number: patchKey(z.number().int()),
  title: patchKey(z.string()),
  priority: patchKey(ticketPrioritySchema),
  category: patchKey(z.string()),
  category_id: patchKey(z.number().int().nullable()),
  category_ref: patchKey(categoryRefSchema.nullable()),
  agent: patchKey(userRefSchema.nullable()),
  created_at: patchKey(isoString),
  public_message_count: patchKey(z.number().int()),
  rating: patchKey(z.number().nullable()),
  last_message_at: patchKey(z.string().nullable()),
  needs_requester_reply: patchKey(z.boolean()),
  expected_reply_by: patchKey(z.string().nullable()),
  first_response_at: patchKey(z.string().nullable()),
  resolved_at: patchKey(z.string().nullable()),
  closed_at: patchKey(z.string().nullable()),
  closed_reason: patchKey(z.enum(["auto_close", "manual"]).nullable()),
  reopened_from_id: patchKey(z.number().int().nullable()),
  reopen_count: patchKey(z.number().int()),
  can_reply: patchKey(z.boolean()),
  can_rate: patchKey(z.boolean()),
  feedback_enabled: patchKey(z.boolean()),
  rate_later_enabled: patchKey(z.boolean()),
});

export const postMessageResultSchema = z.looseObject({
  message: postedMessageSchema,
  ticket: ticketPatchSchema,
  toast: z
    .looseObject({ title: z.string().catch("Reply sent"), body: nullableString })
    .catch({ title: "Reply sent", body: null }),
});

export const reopenDraftSchema = z.looseObject({
  title: z.string().catch(""),
  category_id: nullableNumber,
  category: z.string().catch("general_inquiry"),
  reopened_from_id: z.number().int(),
  reopened_from_display_number: z.string().catch(""),
});

/* ───────────────────────────── narrowing helpers ───────────────────────────── */

const DEV = process.env.NODE_ENV !== "production";

function narrowWith<Out>(
  schema: z.ZodType<Out, unknown>,
  label: string,
): (raw: unknown) => Out | null {
  return (raw) => {
    const result = schema.safeParse(raw);
    if (result.success) return result.data;
    if (DEV) {
      console.warn(`[support] unexpected ${label} payload`, result.error.issues);
    }
    return null;
  };
}

export const narrowMeta = narrowWith<IMeta>(metaSchema, "meta");
export const narrowCounts = narrowWith<TicketCounts>(countsSchema, "counts");
export const narrowCategories = narrowWith<SupportCategory[]>(
  z.array(supportCategorySchema),
  "categories",
);
export const narrowTicketList = narrowWith<TicketRequesterSummary[]>(
  z.array(ticketSummarySchema),
  "ticket list",
);
export const narrowTicketDetail = narrowWith<TicketRequesterDetail>(
  ticketDetailSchema,
  "ticket detail",
);
export const narrowPostedMessage = narrowWith<PostedMessage>(
  postedMessageSchema,
  "posted message",
);
export const narrowPostMessageResult = narrowWith<PostMessageResult>(
  postMessageResultSchema,
  "post message result",
);
export const narrowReopenDraft = narrowWith<ReopenDraft>(reopenDraftSchema, "reopen draft");
export const narrowFeedbackResult = narrowWith<FeedbackResult>(
  feedbackSchemaResponse,
  "feedback",
);
export const narrowUploadedAttachments = narrowWith<UploadedAttachment[]>(
  z.array(uploadedAttachmentSchema),
  "uploaded attachments",
);

export const attachmentUrlSchema = z.looseObject({
  key: z.string().min(1),
  url: z.string().url(),
  expires_in: z.number().int().catch(900),
});

export const narrowAttachmentUrl = narrowWith<AttachmentUrlResult>(attachmentUrlSchema, "attachment url");
