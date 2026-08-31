import { getProjects } from "@/actions/projects/action";
import DashboardProjectTable from "@/components/Dashboard/ProjectListTable/DashboardProjectTable";
import { sampleProjects } from "@/lib/sampleData/fixtures";
import { getSampleDataMode } from "@/lib/sampleData/getSampleDataMode";

const DashboardProjectTableServer = async() => {
    const sampleMode = await getSampleDataMode();
    const result = sampleMode
        ? null
        : await getProjects({
            limit: 4,
        });

    const data = sampleMode ? sampleProjects() : (result?.data ?? []);

    return (
        <div>
            <DashboardProjectTable data={data} isSample={sampleMode}></DashboardProjectTable>
        </div>
    );
};

export default DashboardProjectTableServer;
