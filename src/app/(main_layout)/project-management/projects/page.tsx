/* eslint-disable @typescript-eslint/no-explicit-any */

import ProjectHeroSection from "@/components/ProjectManagement/Projects/ProjectHeroSection";
import ProjectsTableServer from "@/components/ProjectManagement/Projects/ProjectsTableServer";
import ProjectTableSkeleton from "@/skeleton/projectManagement/project/ProjectTableSkeleton";
import { Suspense } from "react";

const Projects = async ({ searchParams }: any) => {

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