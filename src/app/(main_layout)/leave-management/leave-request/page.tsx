import LeaveRequestTable from "@/components/LeaveManagement/LeaveRequest/LeaveRequestTable";

const LeaveRequest = () => {
    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-semibold text-headingTextColor">Leave Management</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the teams member leave details are displayed here
                    </p>
                </div>
            </div>
            <LeaveRequestTable></LeaveRequestTable>
        </div>
    );
};

export default LeaveRequest;