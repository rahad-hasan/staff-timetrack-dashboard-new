import HeadingComponent from "@/components/Common/HeadingComponent";
import { ISearchParamsProps } from "@/types/type";
import AttendanceServer from "@/components/Report/Attendance/AttendanceServer";
import { Suspense } from "react";
import { Metadata } from "next";
import { format } from "date-fns";
import { getAttendance } from "@/actions/report/action";
import AttendanceTableSkeleton from "@/skeleton/report/Attendance/AttendanceTableSkeleton";

export const metadata: Metadata = {
    title: "Staff Time Tracker Attendance",
    description: "Staff Time Tracker Attendance",
};
const AttendancePage = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    // const user = await getDecodedUser();
    const currentDate = format(new Date(), "yyyy-MM-dd");
    // const cookieStore = await cookies();
    // const role = cookieStore.get("staffTimeDashboardRole")?.value;
    // const allowedRoles = ['admin', 'manager', 'hr'];
    // const isAdmin = role && allowedRoles.includes(role);
    // const targetUserId = isAdmin ? params.user_id : user?.id;

    const attendanceListData = await getAttendance({
        date: params.date ?? currentDate,
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="Attendance" subHeading="All the Attendance during the working hour by team member is here"></HeadingComponent>

            </div>
            <Suspense fallback={<AttendanceTableSkeleton />}>
                {

                    <AttendanceServer attendanceListData={attendanceListData?.data}></AttendanceServer>

                }
            </Suspense>

        </div>
    );
};

export default AttendancePage;