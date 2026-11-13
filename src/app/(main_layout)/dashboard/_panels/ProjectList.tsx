import { getProjects } from "@/actions/projects/action";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";
import DashboardProjectTable from "@/components/Dashboard/ProjectListTable/DashboardProjectTable";
import { sampleProjects } from "@/lib/sampleData/fixtures";
import { getSampleDataMode } from "@/lib/sampleData/getSampleDataMode";
import { requireLiveData } from "@/lib/server/liveData";

// A failed read costs only this panel, and clears on the next tab or sort change.
const DashboardProjectTableServer = () => (
    <LiveDataBoundary title="Project list" className="mt-5">
        <ProjectListPanel />
    </LiveDataBoundary>
);

async function ProjectListPanel() {
    // The live read starts alongside the sample-data gate, not after it.
    const [sampleMode, result] = await Promise.all([
        getSampleDataMode(),
        getProjects({ limit: 4 }),
    ]);

    const data = sampleMode
        ? sampleProjects()
        : requireLiveData(result, "the project list");

    return (
        <div>
            <DashboardProjectTable data={data} isSample={sampleMode}></DashboardProjectTable>
        </div>
    );
}

export default DashboardProjectTableServer;
