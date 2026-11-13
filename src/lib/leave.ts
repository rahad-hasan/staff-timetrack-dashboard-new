import { formatCalendarDate } from "@/lib/timezone";
import {
  LeaveApplicableGender,
  LeaveStatus,
  LeaveTypeApplicableFor,
  LeaveTypeRecord,
  LeaveTypeSummary,
  UserScopedLeaveTypeRecord,
} from "@/types/type";
import { hasRole, MANAGEMENT_ROLES } from "@/lib/roles";

/** Approve, reject, edit or delete leave, and manage leave types and holidays. */
export const LEAVE_ADMIN_ROLES = ["admin", "hr"] as const;

/** May look at other employees' leave: the employee filter on every leave page. */
export const canViewTeamLeave = (role: string | undefined) =>
  hasRole(MANAGEMENT_ROLES, role);

export const canManageLeave = (role: string | undefined) =>
  hasRole(LEAVE_ADMIN_ROLES, role);

export type LeaveUserOption = { id: string; label: string; avatar: string };

/** Members (`getMembersDashboard`) as options for the leave pages' employee filter. */
export function toUserOptions(
  members: { id: number; name: string; image?: string | null }[] | null | undefined,
): LeaveUserOption[] {
  return (members ?? []).map((member) => ({
    id: String(member.id),
    label: member.name,
    avatar: member.image ?? "",
  }));
}

const DEFAULT_LEAVE_COLOR = "#7c3aed";

export function normalizeHexColor(value?: string | null) {
  if (!value) return DEFAULT_LEAVE_COLOR;

  const trimmed = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    if (trimmed.length === 4) {
      const [, r, g, b] = trimmed;
      return `#${r}${r}${g}${g}${b}${b}`;
    }

    return trimmed;
  }

  return DEFAULT_LEAVE_COLOR;
}

function hexToRgba(hexColor: string, alpha: number) {
  const normalized = normalizeHexColor(hexColor).replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getLeaveTypeTheme(colorCode?: string | null) {
  const color = normalizeHexColor(colorCode);

  return {
    color,
    backgroundColor: hexToRgba(color, 0.08),
    mutedBackgroundColor: hexToRgba(color, 0.14),
    borderColor: hexToRgba(color, 0.2),
    textColor: color,
  };
}

export function getLeaveStatusTheme(status: LeaveStatus) {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        color: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.10)",
        borderColor: "rgba(22, 163, 74, 0.20)",
      };
    case "rejected":
      return {
        label: "Rejected",
        color: "#e11d48",
        backgroundColor: "rgba(225, 29, 72, 0.10)",
        borderColor: "rgba(225, 29, 72, 0.20)",
      };
    default:
      return {
        label: "Pending",
        color: "#d97706",
        backgroundColor: "rgba(217, 119, 6, 0.10)",
        borderColor: "rgba(217, 119, 6, 0.20)",
      };
  }
}

export function formatApplicableGender(gender: LeaveApplicableGender) {
  if (gender === "all") return "All employees";
  return `${gender.charAt(0).toUpperCase()}${gender.slice(1)} only`;
}

export function formatApplicableFor(
  applicableFor?: LeaveTypeApplicableFor | null,
) {
  if (applicableFor === "all") return "All employees";
  if (!applicableFor) return "All employees";
  return `${applicableFor.charAt(0).toUpperCase()}${applicableFor.slice(1)} only`;
}

export function formatNoticeDays(days: number | null) {
  if (!days) return "No advance notice";
  return `${days} day${days > 1 ? "s" : ""} notice`;
}

export function formatLeaveMetric(value: number, suffix = "days") {
  return `${value} ${suffix}`;
}

/**
 * A leave date for display ("Mon, Sep 14, 2026"). Leave dates arrive as UTC
 * midnights but are calendar dates, not instants: see formatCalendarDate.
 */
export function formatLeaveDate(iso: string | null | undefined): string {
  return formatCalendarDate(iso, "EEE, MMM d, yyyy");
}

export function buildUserScopedLeaveTypes(
  leaveTypes: LeaveTypeRecord[],
  summaryTypes: LeaveTypeSummary[],
): UserScopedLeaveTypeRecord[] {
  const summaryMap = new Map(summaryTypes.map((leaveType) => [leaveType.id, leaveType]));

  return leaveTypes.map((leaveType) => {
    const summary = summaryMap.get(leaveType.id);

    return {
      ...leaveType,
      allowed: summary?.allowed ?? leaveType.days_allowed,
      taken: summary?.taken ?? 0,
      remaining: summary?.remaining ?? leaveType.days_allowed,
      approved_hours: summary?.approved_hours ?? 0,
      approved_hours_formatted: summary?.approved_hours_formatted ?? "0h",
    };
  });
}
