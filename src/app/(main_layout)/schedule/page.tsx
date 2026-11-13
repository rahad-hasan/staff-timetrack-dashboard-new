import { getAllSchedule } from "@/actions/schedule/action";
import HeroSchedule from "@/components/Schedule/HeroSchedule";
import ScheduleTable from "@/components/Schedule/ScheduleTable";
import ClientsTableSkeleton from "@/skeleton/projectManagement/clients/ClientsTableSkeleton";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Staff Time Tracker Schedule",
    description: "Staff Time Tracker Schedule",
};

// The list is the only part that waits on the API: the heading and its
// "Create Schedule" button render at once instead of after the fetch.
const ScheduleList = async () => {
    const result = await getAllSchedule();
    return <ScheduleTable data={result?.data}></ScheduleTable>;
};

const SchedulePage = () => {
    return (
        <div>
            <HeroSchedule></HeroSchedule>
            <Suspense fallback={<ClientsTableSkeleton />}>
                <ScheduleList />
            </Suspense>
        </div>
    );
};

export default SchedulePage;
