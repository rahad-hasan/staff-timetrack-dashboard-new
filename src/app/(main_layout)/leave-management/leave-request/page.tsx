import LeaveRequestTable from "@/components/LeaveManagement/LeaveRequest/LeaveRequestTable";
// import LeaveRequestTableSkeleton from "@/skeleton/leaveManagement/LeaveRequestTableSkeleton";

const LeaveRequest = () => {
    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                    <h1 className=" text-2xl md:text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">Leave Management</h1>
                    <p className="text-sm text-subTextColor mt-2 dark:text-darkTextPrimary">
                        All the teams member leave details are displayed here
                    </p>
                </div>
            </div>
            <LeaveRequestTable></LeaveRequestTable>
            {/* <LeaveRequestTableSkeleton></LeaveRequestTableSkeleton> */}
        </div>
    );
};

export default LeaveRequest;