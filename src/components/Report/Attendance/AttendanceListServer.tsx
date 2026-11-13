import { getAttendance } from "@/actions/report/action";
import { resolveViewFilters } from "@/components/TimeSheets/viewFilters";
import { ISearchParamsProps } from "@/types/type";
import AttendanceServer from "./AttendanceServer";

// Roles that may open a member's profile from the attendance list.
const MEMBER_PROFILE_ROLES = ["admin", "manager", "hr"];

/**
 * Reads the day's attendance inside the page's <Suspense>, so the table
 * skeleton shows while it loads (the page used to await it above the
 * boundary, which held the whole route back instead).
 */
const AttendanceListServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const { user, date } = await resolveViewFilters(params);
  const attendanceListData = await getAttendance({ date });

  return (
    <AttendanceServer
      attendanceListData={attendanceListData?.data}
      canOpenMember={MEMBER_PROFILE_ROLES.includes(user?.role ?? "")}
    ></AttendanceServer>
  );
};

export default AttendanceListServer;
