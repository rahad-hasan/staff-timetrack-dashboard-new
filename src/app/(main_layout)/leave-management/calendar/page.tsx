import { Metadata } from "next";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";

import { getLeaveHistory, getUserLeaveSummary } from "@/actions/leaves/action";
import { getMembersDashboard } from "@/actions/members/action";
import HeadingComponent from "@/components/Common/HeadingComponent";
import LeaveCalendarView from "@/components/LeaveManagement/LeaveCalendar/LeaveCalendarView";
import { ISearchParamsProps, LeaveRecord, UserLeaveSummary } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";

export const metadata: Metadata = {
  title: "Staff Time Tracker Leave Calendar",
  description: "Staff Time Tracker Leave Calendar",
};

const LeaveCalendarPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  const canManageUsers = ["admin", "manager", "hr"].includes(currentUser?.role ?? "");

  const baseDate =
    typeof params.start_month === "string" ? parseISO(params.start_month) : new Date();
  const monthStart = format(startOfMonth(baseDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(baseDate), "yyyy-MM-dd");

  const [calendarResponse, membersResponse] = await Promise.all([
    canManageUsers
      ? getLeaveHistory({
          user_id: typeof params.user_id === "string" ? Number(params.user_id) : undefined,
          start_date: monthStart,
          end_date: monthEnd,
        })
      : getUserLeaveSummary({
          year: baseDate.getFullYear(),
        }),
    canManageUsers ? getMembersDashboard() : Promise.resolve(null),
  ]);

  const items = canManageUsers
    ? ((calendarResponse.data as LeaveRecord[]) ?? [])
    : [
        ...((calendarResponse.data as UserLeaveSummary | undefined)?.requests.pending ?? []),
        ...((calendarResponse.data as UserLeaveSummary | undefined)?.requests.approved ?? []),
        ...((calendarResponse.data as UserLeaveSummary | undefined)?.requests.rejected ?? []),
      ].filter((item) => {
        const leaveStart = parseISO(item.start_date);
        const leaveEnd = parseISO(item.end_date);
        return leaveEnd >= parseISO(monthStart) && leaveStart <= parseISO(monthEnd);
      });

  const users =
    membersResponse?.data?.map((member) => ({
      id: String(member.id),
      label: member.name,
      avatar: member.image ?? "",
    })) ?? [];

  return (
    <div className="space-y-5">
      <HeadingComponent
        heading="Leave Calendar"
        subHeading="Follow leave activity month by month with dynamic leave type colors."
      />
      <LeaveCalendarView
        monthDate={parseISO(monthStart)}
        items={items}
        canManageUsers={canManageUsers}
        users={users}
      />
    </div>
  );
};

export default LeaveCalendarPage;
