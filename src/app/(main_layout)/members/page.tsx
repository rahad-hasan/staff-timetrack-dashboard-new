/* eslint-disable @typescript-eslint/no-explicit-any */

// import TeamsTable from "@/components/Members/TeamsTable";
// import AddTeamModal from "@/components/Members/AddTeamModal";
import MemberHeroSection from "@/components/Members/MemberHeroSection";
import { Suspense } from "react";
import TeamsMemberTableSkeleton from "@/skeleton/teams/TeamsMemberTableSkeleton";
import MemberTableServer from "@/components/Members/MemberTableServer";
// import TeamsMemberTableSkeleton from "@/skeleton/teams/TeamsMemberTableSkeleton";
// import TeamsTableSkeleton from "@/skeleton/teams/TeamsTableSkeleton";

const MemberPage = async ({ searchParams }: any) => {
    // const [activeTab, setActiveTab] = useState<"Teams" | "Members">("Teams");

    // const handleTabClick = (tab: "Teams" | "Members") => {
    //     setActiveTab(tab);
    // };
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
            <Suspense fallback={<TeamsMemberTableSkeleton />}>
                <MemberTableServer searchParams={searchParams} />
            </Suspense>

            {/* <TeamsMemberTableSkeleton></TeamsMemberTableSkeleton> */}

        </div >
    );
};

export default MemberPage;