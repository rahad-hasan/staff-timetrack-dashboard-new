import { getLeaveHistory } from "@/actions/leaves/action";
import { getMembersDashboard } from "@/actions/members/action";
import { canManageLeave, canViewTeamLeave, toUserOptions } from "@/lib/leave";
import { ISearchParamsProps, LeaveStatus } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import LeaveHistoryReport from "./LeaveHistoryReport";

const LeaveHistoryServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  const canManageUsers = canViewTeamLeave(currentUser?.role);
  const currentPage =
    typeof params.page === "string" ? Number(params.page) || 1 : 1;

  const [historyResponse, membersResponse] = await Promise.all([
    getLeaveHistory({
      page: currentPage,
      user_id: canManageUsers ? Number(params.user_id) || undefined : undefined,
      start_date:
        typeof params.from_date === "string" ? params.from_date : undefined,
      end_date: typeof params.to_date === "string" ? params.to_date : undefined,
      status:
        typeof params.status === "string"
          ? (params.status as LeaveStatus)
          : undefined,
    }),
    canManageUsers ? getMembersDashboard() : Promise.resolve(null),
  ]);

  return (
    <LeaveHistoryReport
      data={historyResponse?.data ?? []}
      canManageUsers={canManageUsers}
      canManageLeaves={canManageLeave(currentUser?.role)}
      users={toUserOptions(membersResponse?.data)}
      total={historyResponse?.meta?.total ?? 0}
      currentPage={currentPage}
      limit={historyResponse?.meta?.limit ?? 10}
    />
  );
};

export default LeaveHistoryServer;
