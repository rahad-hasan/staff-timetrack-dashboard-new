/* eslint-disable @typescript-eslint/no-explicit-any */

// import TeamsTable from "@/components/Members/TeamsTable";
// import AddTeamModal from "@/components/Members/AddTeamModal";
import MemberHeroSection from "@/components/Members/MemberHeroSection";
import { Suspense } from "react";
import TeamsMemberTableSkeleton from "@/skeleton/teams/TeamsMemberTableSkeleton";
import MemberTableServer from "@/components/Members/MemberTableServer";
import { Metadata } from "next";
// import TeamsMemberTableSkeleton from "@/skeleton/teams/TeamsMemberTableSkeleton";
// import TeamsTableSkeleton from "@/skeleton/teams/TeamsTableSkeleton";

export const metadata: Metadata = {
    title: "Staff Time Tracker Members",
    description: "Staff Time Tracker Members",
};
const MemberPage = async ({ searchParams }: any) => {
    // const [activeTab, setActiveTab] = useState<"Teams" | "Members">("Teams");

    // const handleTabClick = (tab: "Teams" | "Members") => {
    //     setActiveTab(tab);
    // };
    const query = await searchParams;

    // const query = {
    //     search: params.search ?? "",
    //     page: Number(params.page ?? 1),
    //     limit: Number(params.limit ?? 10),
    //     sortBy: params.sortBy ?? "created_at",
    //     order: params.order ?? "desc",
    //     role: params.role ?? undefined,
    //     status: params.status ?? undefined,
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
                <MemberTableServer query={query} />
            </Suspense>

            {/* <TeamsMemberTableSkeleton></TeamsMemberTableSkeleton> */}

        </div >
    );
};

export default MemberPage;