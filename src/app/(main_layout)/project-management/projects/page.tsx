/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllProject } from "@/api/features/projects/projectsSSRApi";
import ProjectsPage from "@/components/ProjectManagement/Projects/ProjectsPage";

const Projects = async ({ searchParams }: any) => {
    const query = await searchParams;
    const result = await getAllProject({
        search: query.search,
    });
    return (
        <ProjectsPage data={result.data} />
    );
};

export default Projects;