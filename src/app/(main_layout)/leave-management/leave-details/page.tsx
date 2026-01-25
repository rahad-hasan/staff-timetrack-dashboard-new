import HeadingComponent from "@/components/Common/HeadingComponent";
import HeroLeaveDetails from "@/components/LeaveManagement/LeaveDetails/HeroLeaveDetails";
import LeaveDetailsServer from "@/components/LeaveManagement/LeaveDetails/LeaveDetailsServer";
import { ISearchParamsProps } from "@/types/type";
import LeaveDetailsSkeleton from "@/skeleton/leaveManagement/leaveDetailsSkeleton";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Staff Time Tracker Leave Details",
    description: "Staff Time Tracker Leave Details",
};
const LeaveDetails = ({ searchParams }: ISearchParamsProps) => {

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <HeadingComponent heading="Leave Management" subHeading="All the teams member leave details are displayed here"></HeadingComponent>
                <HeroLeaveDetails></HeroLeaveDetails>
            </div>
            <Suspense fallback={<LeaveDetailsSkeleton />}>
                <LeaveDetailsServer searchParams={searchParams} />
            </Suspense>
        </div>
    );
};

export default LeaveDetails;