import { isValid, parseISO } from "date-fns";
import { getLeaveCalendar } from "@/actions/leaves/action";
import { getMembersDashboard } from "@/actions/members/action";
import { canViewTeamLeave, toUserOptions } from "@/lib/leave";
import { getViewerTimeZone } from "@/lib/server/session";
import { todayIn } from "@/lib/timezone";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import LeaveCalendarView from "./LeaveCalendarView";

const LeaveCalendarServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  const canManageUsers = canViewTeamLeave(currentUser?.role);

  // `start_month` is the first day of the month on show ("2026-11-01"). A
  // malformed one — a hand-edited or truncated link — falls back to the
  // viewer's current month: it used to reach the API as year=NaN&month=NaN
  // and then crash the page formatting an Invalid Date.
  const requested =
    typeof params.start_month === "string" ? parseISO(params.start_month) : null;
  const shown =
    requested && isValid(requested)
      ? requested
      : parseISO(todayIn(await getViewerTimeZone()));
  const year = shown.getFullYear();
  const month = shown.getMonth() + 1;

  const [calendarResponse, membersResponse] = await Promise.all([
    getLeaveCalendar({
      year,
      month,
      user_id: Number(params.user_id) ? Number(params.user_id) : "",
    }),
    canManageUsers ? getMembersDashboard() : Promise.resolve(null),
  ]);

  return (
    <LeaveCalendarView
      year={year}
      month={month}
      days={calendarResponse?.data?.days ?? {}}
      retention={calendarResponse?.data?.retention}
      canManageUsers={canManageUsers}
      users={toUserOptions(membersResponse?.data)}
    />
  );
};

export default LeaveCalendarServer;
