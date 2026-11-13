import { getSingleProject } from "@/actions/projects/action";
import { getTasks } from "@/actions/task/action";
import SingleProject from "@/components/ProjectManagement/Projects/SingleProject/SingleProject";
import { ISearchParams } from "@/types/type";
interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: ISearchParams
}

/** A repeated query key arrives as an array; the API takes one value. */
const firstParam = (value: string | string[] | number | undefined) =>
    Array.isArray(value) ? value[0] : value;

const SingleProjectServer = async ({ params, searchParams }: PageProps) => {
    const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);

    // Independent reads: started together, so the page waits for the slower
    // of the two rather than their sum.
    const [result, projectBasedTask] = await Promise.all([
        getSingleProject({
            id: id,
        }),
        getTasks({
            project_id: id,
            limit: 10,
            page: firstParam(resolvedSearchParams.page),
            status: firstParam(resolvedSearchParams.status),
        }),
    ]);

    return (
        <SingleProject data={result?.data} task={projectBasedTask} page={resolvedSearchParams.page}></SingleProject>
    );
};

export default SingleProjectServer;