/* eslint-disable @typescript-eslint/no-explicit-any */
import { getProjects } from "@/actions/projects/action";
import ProjectsPage from "@/components/ProjectManagement/Projects/ProjectsPage";

const ProjectsTableServer = async ({ searchParams }: any) => {
  const params = await searchParams;
  const result = await getProjects({
    search: params?.search,
  });

  return <ProjectsPage data={result.data} />;
};

export default ProjectsTableServer;
