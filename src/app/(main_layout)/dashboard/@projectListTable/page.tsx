import { getProjects } from "@/actions/projects/action";
import DashboardProjectTable from "@/app/(main_layout)/dashboard/@projectListTable/_components/DashboardProjectTable";

const DashboardProjectTableServer = async() => {
    const result = await getProjects({
        limit: 4,
    });

    return (
        <DashboardProjectTable data={result?.data}></DashboardProjectTable>
    );
};

export default DashboardProjectTableServer;