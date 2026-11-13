import { getTasks } from "@/actions/task/action";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";
import DashboardTaskTable from "@/components/Dashboard/TaskListTable/DashboardTaskTable";
import { sampleTasks } from "@/lib/sampleData/fixtures";
import { getSampleDataMode } from "@/lib/sampleData/getSampleDataMode";
import { requireLiveData } from "@/lib/server/liveData";

// A failed read costs only this panel, and clears on the next tab or sort change.
const DashboardTaskTableServer = () => (
    <LiveDataBoundary title="Task list" className="my-5">
        <TaskListPanel />
    </LiveDataBoundary>
);

async function TaskListPanel() {
    // The live read starts alongside the sample-data gate, not after it.
    const [sampleMode, result] = await Promise.all([
        getSampleDataMode(),
        getTasks({ limit: 4 }),
    ]);

    const data = sampleMode
        ? sampleTasks()
        : requireLiveData(result, "the task list");

    return (
        <div>
            <DashboardTaskTable data={data} isSample={sampleMode}></DashboardTaskTable>
        </div>
    );
}

export default DashboardTaskTableServer;
