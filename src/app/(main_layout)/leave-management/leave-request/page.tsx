import HeadingComponent from "@/components/Common/HeadingComponent";
import LeaveRequestServer from "@/components/LeaveManagement/LeaveRequest/LeaveRequestServer";
import LeaveRequestTableSkeleton from "@/skeleton/leaveManagement/LeaveRequestTableSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Suspense } from "react";

const LeaveRequest = async ({ searchParams }: ISearchParamsProps) => {

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="Leave Management" subHeading="All the teams member leave details are displayed here"></HeadingComponent>
            </div>
            <Suspense fallback={<LeaveRequestTableSkeleton />}>
                <LeaveRequestServer searchParams={searchParams} />
            </Suspense>
        </div>
    );
};

export default LeaveRequest;