import { Metadata } from "next";

import { getLeaveTypes, getUserLeaveSummary } from "@/actions/leaves/action";
import { getMembers } from "@/actions/members/action";
import MyLeavesDashboard from "@/components/LeaveManagement/MyLeaves/MyLeavesDashboard";
import { ISearchParamsProps } from "@/types/type";
import { buildUserScopedLeaveTypes } from "@/lib/leave";
import { getDecodedUser } from "@/utils/decodedLogInUser";

export const metadata: Metadata = {
  title: "Staff Time Tracker My Leaves",
  description: "Staff Time Tracker My Leaves",
};

const MyLeavesPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  const canManageUsers = ["admin", "manager", "hr"].includes(currentUser?.role ?? "");
  const selectedUserId =
    canManageUsers && typeof params.user_id === "string"
      ? Number(params.user_id)
      : undefined;

  const [summaryResponse, membersResponse, leaveTypesResponse] = await Promise.all([
      getUserLeaveSummary({
        year: params.year,
        user_id: selectedUserId,
      }),
      canManageUsers
        ? getMembers({
            page: 1,
            limit: 500,
          })
        : Promise.resolve(null),
      getLeaveTypes({
        is_active: true,
      }),
    ]);

  const summaryData =
    summaryResponse?.data ?? {
      user: {
        id: Number(params.user_id) || currentUser?.id || 0,
        name: "Leave summary unavailable",
        image: null,
        email: currentUser?.email ?? "",
        gender: "other" as const,
      },
      year: Number(params.year) || new Date().getFullYear(),
      summary: {
        total_allowed: 0,
        total_taken: 0,
        total_remaining: 0,
        available_percentage: 0,
        available_leaves: 0,
        approved_leave_hours: 0,
        approved_leave_hours_formatted: "0h",
        leave_types: [],
      },
      requests: {
        pending: [],
        approved: [],
        rejected: [],
      },
      next_holidays: [],
    };

  const memberUsers =
    membersResponse?.data
      ?.filter((member) => member.is_active && !member.is_deleted)
      .map((member) => ({
        id: String(member.id),
        label: member.name,
        avatar: member.image ?? "",
      })) ?? [];

  const users = Array.from(
    new Map(
      [
        ...memberUsers,
        {
          id: String(summaryData.user.id),
          label: summaryData.user.name,
          avatar: summaryData.user.image ?? "",
        },
      ].map((user) => [user.id, user]),
    ).values(),
  ).sort((first, second) => first.label.localeCompare(second.label));

  const leaveTypes = buildUserScopedLeaveTypes(
    leaveTypesResponse?.data ?? [],
    summaryData.summary.leave_types,
  );

  return (
    <MyLeavesDashboard
      data={summaryData}
      leaveTypes={leaveTypes}
      currentUserId={currentUser?.id}
      canManageUsers={canManageUsers}
      users={users}
      allowRequestLeave={currentUser?.id === summaryData.user.id}
    />
  );
};

export default MyLeavesPage;
