import { getSingleProject } from "@/actions/projects/action";
import { getTasks } from "@/actions/task/action";
import SingleProject from "@/components/ProjectManagement/Projects/SingleProject/SingleProject";
import { ISearchParams } from "@/types/type";
interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: ISearchParams
}
const SingleProjectServer = async ({ params, searchParams }: PageProps) => {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;

    const result = await getSingleProject({
        id: id,
    });

    const projectBasedTask = await getTasks({
        project_id: id,
        limit: 10,
        page: resolvedSearchParams.page,
        status: resolvedSearchParams.status
    });

    return (
        <div>
            <SingleProject data={result?.data} task={projectBasedTask} page={resolvedSearchParams.page}></SingleProject>
        </div>
    );
};

export default SingleProjectServer;