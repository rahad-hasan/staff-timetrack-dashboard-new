import { getTasks } from "@/actions/task/action";
import DashboardTaskTable from "@/components/Dashboard/TaskListTable/DashboardTaskTable";

const DashboardTaskTableServer = async () => {
    const result = await getTasks({
        limit: 4
    });

    return (
        <div>
            <DashboardTaskTable data={result.data}></DashboardTaskTable>
        </div>
    );
};

export default DashboardTaskTableServer;