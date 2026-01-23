import AttendanceTable from "@/components/Report/Attendance/AttendanceTable";
import { ISearchParamsProps } from "@/types/type";
import { getAttendance } from "@/actions/report/action";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { format } from "date-fns";
import { cookies } from "next/headers";

// import AttendanceTableSkeleton from "@/skeleton/report/Attendance/AttendanceTableSkeleton";0

const AttendanceServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const user = await getDecodedUser();
    const currentDate = format(new Date(), "yyyy-MM-dd");
    const cookieStore = await cookies();
    const role = cookieStore.get("staffTimeDashboardRole")?.value;
    const allowedRoles = ['admin', 'manager', 'hr'];
    const isAdmin = role && allowedRoles.includes(role);
    const targetUserId = isAdmin ? params.user_id : user?.id;

    const attendanceListData = await getAttendance({
        date: params.date ?? currentDate,
        user_id: targetUserId,
    });

    return (
        <div>
            <AttendanceTable attendanceListData={attendanceListData?.data}></AttendanceTable>
        </div>
    );
};

export default AttendanceServer;