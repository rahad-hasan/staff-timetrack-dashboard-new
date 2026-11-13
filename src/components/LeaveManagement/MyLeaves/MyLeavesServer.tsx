import {
  getLeaveRequestTypeDropdown,
  getUserLeaveSummary,
} from "@/actions/leaves/action";
import { getMembersDashboard } from "@/actions/members/action";
import { canManageLeave, canViewTeamLeave, toUserOptions } from "@/lib/leave";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import MyLeavesDashboard from "./MyLeavesDashboard";

const MyLeavesServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  const canManageUsers = canViewTeamLeave(currentUser?.role);

  const selectedUserId =
    canManageUsers && typeof params.user_id === "string"
      ? Number(params.user_id)
      : undefined;

  // Independent reads, so one round trip — the summary used to finish before
  // the other two even started.
  const [summaryResponse, membersResponse, leaveTypesResponse] =
    await Promise.all([
      getUserLeaveSummary({
        year: typeof params.year === "string" ? params.year : undefined,
        user_id: selectedUserId,
      }),
      canManageUsers ? getMembersDashboard() : Promise.resolve(null),
      getLeaveRequestTypeDropdown(),
    ]);

  const summaryData = summaryResponse?.data ?? {
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

  return (
    <MyLeavesDashboard
      data={summaryData}
      // A failed dropdown read must not take "New request" down with it.
      leaveTypes={leaveTypesResponse?.data ?? []}
      currentUserId={currentUser?.id}
      canManageUsers={canManageUsers}
      canManageLeaves={canManageLeave(currentUser?.role)}
      users={toUserOptions(membersResponse?.data)}
      allowRequestLeave={currentUser?.id === summaryData.user.id}
    />
  );
};

export default MyLeavesServer;
