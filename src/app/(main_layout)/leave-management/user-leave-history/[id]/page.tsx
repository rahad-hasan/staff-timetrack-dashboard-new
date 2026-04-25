import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUserLeaveSummary } from "@/actions/leaves/action";
import { getMembersDashboard } from "@/actions/members/action";
import MyLeavesDashboard from "@/components/LeaveManagement/MyLeaves/MyLeavesDashboard";
import { ISearchParams } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";

export const metadata: Metadata = {
  title: "Staff Time Tracker User Leave History",
  description: "Staff Time Tracker User Leave History",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: ISearchParams;
}

const UserLeaveHistoryPage = async ({ params, searchParams }: PageProps) => {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const currentUser = await getDecodedUser();
  const canManageUsers = ["admin", "manager", "hr", "project_manager"].includes(
    currentUser?.role ?? "",
  );

  const userId = Number(id);

  if (Number.isNaN(userId)) {
    redirect("/leave-management/my-leaves");
  }

  const [summaryResponse, membersResponse] = await Promise.all([
    getUserLeaveSummary({
      year: resolvedSearchParams.year,
      user_id: userId,
    }),
    canManageUsers ? getMembersDashboard() : Promise.resolve(null),
  ]);

  const users =
    membersResponse?.data?.map((member) => ({
      id: String(member.id),
      label: member.name,
      avatar: member.image ?? "",
    })) ?? [];

  const summaryData =
    summaryResponse?.data ?? {
      user: {
        id: userId,
        name: "Leave summary unavailable",
        image: null,
        email: "",
        gender: "other" as const,
      },
      year: Number(resolvedSearchParams.year) || new Date().getFullYear(),
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
      leaveTypes={[]}
      currentUserId={currentUser?.id}
      canManageUsers={canManageUsers}
      users={users}
      allowRequestLeave={false}
      showUserSelector={false}
      headingTitle={`${summaryData.user.name} Leave History`}
      headingSubtitle={`Detailed leave balances, active policy coverage, and request history for ${summaryData.year}.`}
      backHref="/leave-management/leave-types"
      backLabel="Back to leave types"
    />
  );
};

export default UserLeaveHistoryPage;
