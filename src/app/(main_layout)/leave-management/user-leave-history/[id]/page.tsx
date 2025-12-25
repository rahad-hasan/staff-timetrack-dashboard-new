import HeadingComponent from "@/components/Common/HeadingComponent";
import UserLeaveHistoryServer from "@/components/LeaveManagement/UserLeaveHistory/UserLeaveHistoryServer";
import UserLeaveHistorySkeleton from "@/skeleton/leaveManagement/UserLeaveHistorySkeleton";
import { ISearchParams } from "@/types/type";
import { Suspense } from "react";


interface IPageProps {
    params: Promise<{ id: string }>;
    searchParams: ISearchParams;
}

const UserLeaveHistoryPage = async ({ params, searchParams }: IPageProps) => {
    const { id } = await params
    console.log(id);
    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="User Leave History" subHeading="Single member leave history are displayed here"></HeadingComponent>
            </div>
            <Suspense fallback={<UserLeaveHistorySkeleton />}>
                <UserLeaveHistoryServer id={id} searchParams={searchParams} />
            </Suspense>
        </div>
    );
};

export default UserLeaveHistoryPage;