import { getAllSchedule } from "@/actions/schedule/action";
import HeroSchedule from "@/components/Schedule/HeroSchedule";
import ScheduleTable from "@/components/Schedule/ScheduleTable";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Staff Time Tracker Schedule",
    description: "Staff Time Tracker Schedule",
};
const SchedulePage = async () => {
    const result = await getAllSchedule();

    return (
        <div>
            <HeroSchedule></HeroSchedule>
            <ScheduleTable data={result?.data}></ScheduleTable>
        </div>
    );
};

export default SchedulePage;