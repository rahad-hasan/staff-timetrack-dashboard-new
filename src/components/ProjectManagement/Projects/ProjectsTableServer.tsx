/* eslint-disable @typescript-eslint/no-explicit-any */
import { getProjects } from "@/actions/projects/projectsAction";
import ProjectsPage from "@/components/ProjectManagement/Projects/ProjectsPage";

const ProjectsTableServer = async ({ searchParams }: any) => {
  const result = await getProjects({
    search: searchParams?.search,
  });

  return <ProjectsPage data={result.data} />;
};

export default ProjectsTableServer;
