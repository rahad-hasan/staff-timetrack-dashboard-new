"use client"

import { IProject } from "@/global/globalTypes";
import { useSearchParams } from "next/navigation";
import ProjectTable from "./ProjectTable";
import ArchivedProjectTable from "./ArchivedProjectTable";

const ProjectsPage = ({ data }: { data: IProject[] }) => {
    type Tab = "active" | "archived";
    const searchParams = useSearchParams();
    const activeTab = (searchParams.get("tab") as Tab) ?? "active";

    return (
        <div>
            {
                activeTab === "active" &&
                <ProjectTable data={data} />
            }
            {
                activeTab === "archived" &&
                <ArchivedProjectTable></ArchivedProjectTable>
            }
            {/* {
                activeTab === "Archived" &&
                <ArchivedProjectTableSkeleton></ArchivedProjectTableSkeleton>
            } */}
        </div>
    );
};

export default ProjectsPage;