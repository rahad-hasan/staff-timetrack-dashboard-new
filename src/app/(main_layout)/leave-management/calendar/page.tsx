import { Metadata } from "next";
import { parseISO } from "date-fns";

import { getLeaveCalendar } from "@/actions/leaves/action";
import { getMembersDashboard } from "@/actions/members/action";
import HeadingComponent from "@/components/Common/HeadingComponent";
import LeaveCalendarView from "@/components/LeaveManagement/LeaveCalendar/LeaveCalendarView";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";

export const metadata: Metadata = {
  title: "Staff Time Tracker Leave Calendar",
  description: "Staff Time Tracker Leave Calendar",
};

const LeaveCalendarPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  const canManageUsers = ["admin", "manager", "hr"].includes(currentUser?.role ?? "");

  const selectedYear = Number(params.year);
  const selectedMonth = Number(params.month);
  const hasYearMonth =
    Number.isFinite(selectedYear) &&
    Number.isFinite(selectedMonth) &&
    selectedMonth >= 1 &&
    selectedMonth <= 12;
  const baseDate =
    typeof params.start_month === "string"
      ? parseISO(params.start_month)
      : hasYearMonth
        ? new Date(selectedYear, selectedMonth - 1, 1)
        : new Date();
  const userIdParam =
    canManageUsers && typeof params.user_id === "string"
      ? Number(params.user_id)
      : undefined;
  const selectedUserId = Number.isFinite(userIdParam) ? userIdParam : undefined;

  const [calendarResponse, membersResponse] = await Promise.all([
    getLeaveCalendar({
      year: baseDate.getFullYear(),
      month: baseDate.getMonth() + 1,
      user_id: selectedUserId,
    }),
    canManageUsers ? getMembersDashboard() : Promise.resolve(null),
  ]);

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
        monthDate={new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)}
        days={calendarResponse?.data?.days ?? {}}
        canManageUsers={canManageUsers}
        users={users}
      />
    </div>
  );
};

export default LeaveCalendarPage;
