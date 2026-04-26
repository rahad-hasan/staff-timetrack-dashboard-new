import { Metadata } from "next";
import { getLeaveHistory } from "@/actions/leaves/action";
import { getMembersDashboard } from "@/actions/members/action";
import HeadingComponent from "@/components/Common/HeadingComponent";
import LeaveHistoryReport from "@/components/LeaveManagement/LeaveHistory/LeaveHistoryReport";
import { ISearchParamsProps, LeaveStatus } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";

export const metadata: Metadata = {
  title: "Staff Time Tracker Leave History",
  description: "Staff Time Tracker Leave History",
};

const LeaveHistoryPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  const canManageUsers = ["admin", "manager", "hr"].includes(currentUser?.role ?? "");
  const currentPage =
    typeof params.page === "string" ? Number(params.page) || 1 : 1;

  const [historyResponse, membersResponse] = await Promise.all([
    getLeaveHistory({
      page: currentPage,
      user_id: canManageUsers ? Number(params.user_id) || undefined : undefined,
      start_date: typeof params.from_date === "string" ? params.from_date : undefined,
      end_date: typeof params.to_date === "string" ? params.to_date : undefined,
      status: typeof params.status === "string" ? (params.status as LeaveStatus) : undefined,
    }),
    canManageUsers ? getMembersDashboard() : Promise.resolve(null),
  ]);

  console.log(historyResponse.data)

  const users =
    membersResponse?.data?.map((member) => ({
      id: String(member.id),
      label: member.name,
      avatar: member.image ?? "",
    })) ?? [];

  return (
    <div className="space-y-5">
      <HeadingComponent
        heading="Leave History"
        subHeading="Audit leave decisions with employee, date range, and status filters."
      />
      <LeaveHistoryReport
        data={historyResponse.data ?? []}
        canManageUsers={canManageUsers}
        users={users}
        total={(historyResponse.meta?.total as number) ?? 0}
        currentPage={currentPage}
        limit={(historyResponse.meta?.limit as number) ?? 10}
      />
    </div>
  );
};

export default LeaveHistoryPage;
