import { getSingleDetailsMember } from "@/actions/members/action";
import SingleMemberPage from "@/components/Members/SingleMemberPage/SingleMemberPage";
import { ISearchParams } from "@/types/type";
interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: ISearchParams
}
const MemberDetailsServer = async ({ params, searchParams }: PageProps) => {
    const { id } = await params;
    await searchParams;

    const result = await getSingleDetailsMember(id);
    return (
        <div>
            <SingleMemberPage data={result?.data}></SingleMemberPage>
        </div>
    );
};

export default MemberDetailsServer;
