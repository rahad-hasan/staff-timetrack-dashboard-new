import { getSingleDetailsMember } from "@/actions/members/action";
import SingleMemberPage from "@/components/Members/SingleMemberPage/SingleMemberPage";

const MemberDetailsServer = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const result = await getSingleDetailsMember(id);
    console.log(result);

    return (
        <div>
            <SingleMemberPage data={result?.data}></SingleMemberPage>
        </div>
    );
};

export default MemberDetailsServer;