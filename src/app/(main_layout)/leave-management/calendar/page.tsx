import { Metadata } from "next";
import { parseISO } from "date-fns";
import { getLeaveCalendar } from "@/actions/leaves/action";
import { getMembersDashboard } from "@/actions/members/action";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import LeaveCalendarView from "@/components/LeaveManagement/LeaveCalendarView";

export const metadata: Metadata = {
  title: "Staff Time Tracker Leave Calendar",
  description: "Staff Time Tracker Leave Calendar",
};

const LeaveCalendarPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  const canManageUsers = ["admin", "manager", "hr"].includes(currentUser?.role ?? "");

  const startMonth =
    typeof params.start_month === "string"
      ? parseISO(params.start_month)
      : new Date();
  const selectedMonth = startMonth.getMonth() + 1;
  const selectedYear = startMonth.getFullYear();


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

  const [calendarResponse, membersResponse] = await Promise.all([
    getLeaveCalendar({
      year: selectedYear,
      month: selectedMonth,
      user_id: Number(params.user_id) ? Number(params.user_id) : "",
    }),
    canManageUsers ? getMembersDashboard() : Promise.resolve(null),
  ]);

  // console.log(calendarResponse)

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
