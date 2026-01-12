import AttendanceTable from "@/components/Report/Attendance/AttendanceTable";
import { ISearchParamsProps } from "@/types/type";
import { getAttendance } from "@/actions/report/action";

// import AttendanceTableSkeleton from "@/skeleton/report/Attendance/AttendanceTableSkeleton";0

const AttendanceServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    let attendanceListData;
    if (params.date) {
        attendanceListData = await getAttendance({
            date: params.date as string,
            user_id: Number(params.user_id),
        });
    }

    return (
        <div>
            <AttendanceTable attendanceListData={attendanceListData?.data}></AttendanceTable>
        </div>
    );
};

export default AttendanceServer;