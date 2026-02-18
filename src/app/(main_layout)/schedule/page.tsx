import { getAllSchedule } from "@/actions/schedule/action";
import HeadingComponent from "@/components/Common/HeadingComponent";
import ScheduleTable from "@/components/Schedule/ScheduleTable";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Staff Time Tracker Schedule",
    description: "Staff Time Tracker Schedule",
};
const SchedulePage = async () => {
    const result = await getAllSchedule();
    console.log(result);
    return (
        <div>
            <HeadingComponent heading="Schedule Management" subHeading="All the teams member schedule details are displayed here"></HeadingComponent>
            <ScheduleTable data={result?.data}></ScheduleTable>
        </div>
    );
};

export default SchedulePage;