import { getSingleDetailsMember } from "@/actions/members/action";
import { getTasks } from "@/actions/task/action";
import SingleMemberPage from "@/components/Members/SingleMemberPage/SingleMemberPage";
import { ISearchParams } from "@/types/type";
interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: ISearchParams
}
const MemberDetailsServer = async ({ params, searchParams }: PageProps) => {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;

    const result = await getSingleDetailsMember(id);
    const projectBasedTask = await getTasks({
        user_id: id,
        limit: 10,
        page: resolvedSearchParams.page,
        status: resolvedSearchParams.status
    });
    return (
        <div>
            <SingleMemberPage data={result?.data} task={projectBasedTask} page={resolvedSearchParams.page}></SingleMemberPage>
        </div>
    );
};

export default MemberDetailsServer;