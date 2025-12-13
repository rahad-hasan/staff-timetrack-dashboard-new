/* eslint-disable @typescript-eslint/no-explicit-any */

// import TeamsTable from "@/components/Members/TeamsTable";
// import AddTeamModal from "@/components/Members/AddTeamModal";
import TeamsMemberTable from "@/components/Members/TeamsMemberTable";
import MemberHeroSection from "@/components/Members/MemberHeroSection";
import { getAllMember } from "@/api/features/members/memberSSRApi";
// import TeamsMemberTableSkeleton from "@/skeleton/teams/TeamsMemberTableSkeleton";
// import TeamsTableSkeleton from "@/skeleton/teams/TeamsTableSkeleton";

const TeamsPage = async ({ searchParams }: any) => {
    console.log(searchParams.search);
    // const [activeTab, setActiveTab] = useState<"Teams" | "Members">("Teams");

    // const handleTabClick = (tab: "Teams" | "Members") => {
    //     setActiveTab(tab);
    // };
    const result = await getAllMember({
        search: searchParams.search,
    });
    console.log('getting from api😀',result);

    return (
        <div>
            <MemberHeroSection></MemberHeroSection>
            {/* {
                activeTab === "Teams" &&
                <TeamsTable></TeamsTable>
            } */}
            {/* {
                activeTab === "Teams" &&
                <TeamsTableSkeleton></TeamsTableSkeleton>
            } */}
            {/* {
                activeTab === "Members" && */}
            <TeamsMemberTable data={result?.data}></TeamsMemberTable>

            {/* <TeamsMemberTableSkeleton></TeamsMemberTableSkeleton> */}

        </div >
    );
};

export default TeamsPage;