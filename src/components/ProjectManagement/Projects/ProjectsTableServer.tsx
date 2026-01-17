/* eslint-disable @typescript-eslint/no-explicit-any */
import { getProjects } from "@/actions/projects/action";
import AppPagination from "@/components/Common/AppPagination";
import ProjectsPage from "@/components/ProjectManagement/Projects/ProjectsPage";

const ProjectsTableServer = async ({ searchParams }: any) => {
  const params = await searchParams;
  const result = await getProjects({
    search: params?.search,
    page: params.page,
  });

  return (
    <>
      <ProjectsPage data={result.data} />
      <AppPagination
        total={result?.meta?.total ?? 1}
        currentPage={params.page}
        limit={result?.meta?.limit ?? 10}
      />
    </>
  )
};

export default ProjectsTableServer;
