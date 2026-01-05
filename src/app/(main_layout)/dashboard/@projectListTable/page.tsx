import { getProjects } from "@/actions/projects/action";
import DashboardProjectTable from "@/components/Dashboard/ProjectListTable/DashboardProjectTable";

const DashboardProjectTableServer = async() => {
    const result = await getProjects({
        limit: 4,
    });
    console.log(result);
    return (
        <div>
            <DashboardProjectTable data={result?.data}></DashboardProjectTable>
        </div>
    );
};

export default DashboardProjectTableServer;