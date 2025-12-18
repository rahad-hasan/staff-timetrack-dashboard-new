/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllProject } from "@/api/features/projects/projectsSSRApi";
import ProjectsPage from "@/components/ProjectManagement/Projects/ProjectsPage";

const ProjectsTableServer = async ({ searchParams }: any) => {
  const result = await getAllProject({
    search: searchParams?.search,
  });

  return <ProjectsPage data={result.data} />;
};

export default ProjectsTableServer;
