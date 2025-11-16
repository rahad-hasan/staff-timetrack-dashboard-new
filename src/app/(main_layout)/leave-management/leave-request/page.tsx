import HeadingComponent from "@/components/Common/HeadingComponent";
import LeaveRequestTable from "@/components/LeaveManagement/LeaveRequest/LeaveRequestTable";
// import LeaveRequestTableSkeleton from "@/skeleton/leaveManagement/LeaveRequestTableSkeleton";

const LeaveRequest = () => {
    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="Leave Management" subHeading="All the teams member leave details are displayed here"></HeadingComponent>
            </div>
            <LeaveRequestTable></LeaveRequestTable>
            {/* <LeaveRequestTableSkeleton></LeaveRequestTableSkeleton> */}
        </div>
    );
};

export default LeaveRequest;