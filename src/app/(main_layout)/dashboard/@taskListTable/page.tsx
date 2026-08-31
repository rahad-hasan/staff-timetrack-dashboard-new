import { getTasks } from "@/actions/task/action";
import DashboardTaskTable from "@/components/Dashboard/TaskListTable/DashboardTaskTable";
import { sampleTasks } from "@/lib/sampleData/fixtures";
import { getSampleDataMode } from "@/lib/sampleData/getSampleDataMode";

const DashboardTaskTableServer = async () => {
    const sampleMode = await getSampleDataMode();
    const result = sampleMode
        ? null
        : await getTasks({
            limit: 4
        });

    const data = sampleMode ? sampleTasks() : (result?.data ?? []);

    return (
        <div>
            <DashboardTaskTable data={data} isSample={sampleMode}></DashboardTaskTable>
        </div>
    );
};

export default DashboardTaskTableServer;
