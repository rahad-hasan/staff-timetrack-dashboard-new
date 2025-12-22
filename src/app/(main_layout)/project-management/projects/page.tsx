import ProjectHeroSection from "@/components/ProjectManagement/Projects/ProjectHeroSection";
import ProjectsTableServer from "@/components/ProjectManagement/Projects/ProjectsTableServer";
import ProjectTableSkeleton from "@/skeleton/projectManagement/project/ProjectTableSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Suspense } from "react";

const Projects = async ({ searchParams }: ISearchParamsProps) => {

    return (
        <div>
            <ProjectHeroSection></ProjectHeroSection>

            <Suspense fallback={<ProjectTableSkeleton />}>
                <ProjectsTableServer searchParams={searchParams} />
            </Suspense>
        </div>
    );
};

export default Projects;