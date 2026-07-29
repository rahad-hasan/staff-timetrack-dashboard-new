import { getTasks } from "@/actions/task/action";
import DashboardTaskTable from "@/app/(main_layout)/dashboard/@taskListTable/_components/DashboardTaskTable";

const DashboardTaskTableServer = async () => {
    const result = await getTasks({
        limit: 4
    });

    return (
        <DashboardTaskTable data={result.data}></DashboardTaskTable>
    );
};

export default DashboardTaskTableServer;