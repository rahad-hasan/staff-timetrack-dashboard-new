import { getSingleDetailsMember } from "@/actions/members/action";
// import { getTasks } from "@/actions/task/action";
import SingleMemberPage from "@/components/Members/SingleMemberPage/SingleMemberPage";
import { ISearchParams } from "@/types/type";
interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: ISearchParams
}
const MemberDetailsServer = async ({ params }: PageProps) => {
    const { id } = await params;
    // const resolvedSearchParams = await searchParams;

    const result = await getSingleDetailsMember(id);
    // console.log('result', result)
    // const projectBasedTask = await getTasks({
    //     user_id: id,
    //     limit: 10,
    //     page: resolvedSearchParams.page,
    //     status: resolvedSearchParams.status
    // });
    
    return (
        <SingleMemberPage data={result?.data}></SingleMemberPage>
        // <SingleMemberPage data={data} task={task} page={page}></SingleMemberPage>
    );
};

export default MemberDetailsServer;