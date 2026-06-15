import type { IMeta } from "./type";

export type TSuspensionReason =
  | "NONE"
  | "LOW_DIVERSITY_TYPING"
  | "INPUT_FLOOD"
  | "RHYTHMIC_INPUT"
  | "AUTO_CLICKER"
  | "GHOST_WORKER"
  | "MODIFIED_DATA"
  | "SUSPICIOUS_APP"
  | "HIGH_ACTIVITY"
  | "CONSISTENT_ACTIVITY"
  | "PREDOMINANT_MOUSE"
  | "PREDOMINANT_KEYBOARD"
  | "SUSTAINED_HIGH_FOCUS"
  | "BREAKLESS_WORK"
  | "MANUAL";

export type TSeverity = "low" | "medium" | "high" | "critical";

export type TSuspensionSource = "manual" | "anomaly_engine" | "system";

export type TSuspensionType =
  | "temporary"
  | "scheduled"
  | "indefinite"
  | "recurring"
  | "anomaly_triggered"
  | "review_hold";

export type TSuspensionStatus =
  | "pending_review"
  | "approved"
  | "scheduled"
  | "active"
  | "expired"
  | "lifted"
  | "cancelled"
  | "rejected";

export type TSuspensionStatusFilter = "ongoing" | "closed" | "all";

export interface ISuspensionReasonOption {
  reason: TSuspensionReason;
  severity: TSeverity;
}

export interface ISuspensionUser {
  id: number;
  name: string;
  email: string;
  image: string | null;
}

export interface ISuspensionProject {
  id: number;
  name: string;
}

export interface ISuspensionTask {
  id: number;
  name: string;
}

export interface ISuspensionSummaryRow {
  user: ISuspensionUser;
  event_count: number;
  ongoing_count: number;
  high_severity_count: number;
  total_duration_sec: number;
  total_duration: string;
  last_event_at: string | null;
  last_event_at_format: string | null;
  top_reason: string | null;
}

export interface ISuspensionSummaryTotals {
  total_users: number;
  total_events: number;
  total_ongoing: number;
  total_high_severity: number;
  total_duration_sec: number;
  total_duration: string;
}

export interface ISuspensionSummary {
  rows: ISuspensionSummaryRow[];
  totals: ISuspensionSummaryTotals;
}

export interface ISuspensionEvent {
  id: number;
  user: ISuspensionUser;
  project: ISuspensionProject | null;
  task: ISuspensionTask | null;
  source: TSuspensionSource;
  type: TSuspensionType;
  status: TSuspensionStatus;
  severity: TSeverity;
  reason: TSuspensionReason | string;
  reason_code: string;
  reason_text: string | null;
  description: string | null;
  risk_score: number | null;
  ongoing: boolean;
  starts_at: string;
  starts_at_format: string;
  ends_at: string | null;
  ends_at_format: string | null;
  resumed_at: string | null;
  resumed_at_format: string | null;
  duration_sec: number;
  duration: string;
}

export type TSuspensionAuditEventType =
  | "created"
  | "approved"
  | "scheduled"
  | "activated"
  | "lifted"
  | "expired"
  | "cancelled"
  | "rejected"
  | "review_requested"
  | "enforcement_blocked"
  | "note_added";

export interface ISuspensionAuditEvent {
  id: number;
  event_type: TSuspensionAuditEventType;
  from_status: string | null;
  to_status: string | null;
  actor_user_id: number | null;
  note: string | null;
  created_at: string;
  created_at_format: string;
}

export interface ISuspensionScreenshot {
  id: number;
  image: string;
  display_name: string | null;
  time: string;
  time_format: string;
  score: number | null;
  mouse_activity: number | null;
  keyboard_activity: number | null;
  anomaly: boolean | null;
}

export interface ISuspensionEventDetail extends ISuspensionEvent {
  created_at: string;
  events: ISuspensionAuditEvent[];
  screenshots: ISuspensionScreenshot[];
}

export interface ISuspensionSummaryQuery {
  page?: number;
  limit?: number;
  user_id?: number | string;
  project_id?: number | string;
  from_date?: string;
  to_date?: string;
  search?: string;
  sort?: "total_duration_sec" | "event_count" | "last_suspended_at" | "name";
  order?: "asc" | "desc";
  timezone?: string;
}

export interface ISuspensionEventsQuery {
  page?: number;
  limit?: number;
  user_id?: number | string;
  project_id?: number | string;
  from_date?: string;
  to_date?: string;
  search?: string;
  timezone?: string;
  reason?: TSuspensionReason | string;
  severity?: TSeverity;
  status?: TSuspensionStatusFilter;
  sort?: "suspended_at" | "duration_sec" | "resumed_at";
  order?: "asc" | "desc";
}

export type { IMeta };
