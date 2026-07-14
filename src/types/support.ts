export type TicketStatus =
  | "open"
  | "in_progress"
  | "pending_customer"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketCategory =
  | "timer_issue"
  | "manual_entry"
  | "calendar_sync"
  | "billing_invoice"
  | "integration"
  | "desktop_app"
  | "general_inquiry";

export type TicketMessageRole = "user" | "agent";

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

export const TICKET_CATEGORY_VALUES: TicketCategory[] = [
  "timer_issue",
  "manual_entry",
  "calendar_sync",
  "billing_invoice",
  "integration",
  "desktop_app",
  "general_inquiry",
];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  pending_customer: "Waiting on you",
  resolved: "Resolved",
  closed: "Closed",
};

export const STATUS_BADGE_CLASSES: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  in_progress:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  pending_customer:
    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  resolved:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  closed:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const PRIORITY_BADGE_CLASSES: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700",
  medium:
    "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
  high: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  critical:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  timer_issue: "Timer issue",
  manual_entry: "Manual entry",
  calendar_sync: "Calendar sync",
  billing_invoice: "Billing / Invoice",
  integration: "Integration",
  desktop_app: "Desktop app",
  general_inquiry: "General inquiry",
};

export interface TicketAgent {
  id: number;
  name: string;
}

export interface TicketFeedback {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface TicketListItem {
  id: number;
  ticket_number: number;
  display_number: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  created_at: string;
  updated_at: string;
  assignedAgent: TicketAgent | null;
  feedback: { rating: number } | null;
  _count: { conversations: number };
}

export interface TicketConversation {
  id: number;
  sender_id: number;
  sender_role: TicketMessageRole;
  message: string;
  attachments: string[];
  created_at: string;
  sender: { id: number; name: string };
  is_private?: boolean;
}

export interface TicketDetail {
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
  assignedAgent: TicketAgent | null;
  conversations: TicketConversation[];
  feedback: TicketFeedback | null;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  affected_time_entry_id?: number;
  affected_project?: string;
  client_logs?: string[];
  device_info?: Record<string, unknown>;
  attachments?: string[];
}

export interface CreateReplyPayload {
  message: string;
  attachments?: string[];
}

export interface SubmitFeedbackPayload {
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

export interface TicketListFilters {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  category?: TicketCategory;
}

export interface TicketMessageEvent {
  id: number;
  ticket_id?: number;
  sender_id: number;
  sender_role: TicketMessageRole;
  message: string;
  attachments: string[];
  created_at: string;
  sender: { id: number; name: string };
  display_number?: string;
  is_private?: boolean;
}

export interface TicketStatusChangedEvent {
  ticket_id: number;
  from: TicketStatus;
  to: TicketStatus;
}

export interface TicketAssignedEvent {
  ticket_id: number;
  agent: TicketAgent | null;
}
