"use client"
import SearchBar from "@/components/Common/SearchBar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
// import { useState } from "react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
// import TeamsTable from "@/components/Members/TeamsTable";
// import AddTeamModal from "@/components/Members/AddTeamModal";
import TeamsMemberTable from "@/components/Members/TeamsMemberTable";
import AddNewMemberModal from "@/components/Members/AddNewMemberModal";
import HeadingComponent from "@/components/Common/HeadingComponent";
// import TeamsMemberTableSkeleton from "@/skeleton/teams/TeamsMemberTableSkeleton";
// import TeamsTableSkeleton from "@/skeleton/teams/TeamsTableSkeleton";

const TeamsPage = () => {
    // const [activeTab, setActiveTab] = useState<"Teams" | "Members">("Teams");

    // const handleTabClick = (tab: "Teams" | "Members") => {
    //     setActiveTab(tab);
    // };
    const handleSearch = (query: string) => {
        console.log("Searching for:", query);
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <HeadingComponent heading="Members" subHeading="All the member are displayed here"></HeadingComponent>

                {/* <div className="">
                    {
                        activeTab === "Teams" &&
                        <Dialog>
                            <form>
                                <DialogTrigger asChild>
                                    <Button className=" text-sm md:text-base py-2"><Plus className="size-5" /> <span className=" hidden sm:block">Add Team</span></Button>
                                </DialogTrigger>
                                <AddTeamModal></AddTeamModal>
                            </form>
                        </Dialog>
                    }
                    {
                        activeTab === "Members" && */}
                        <Dialog>
                            <form>
                                <DialogTrigger asChild>
                                    <Button className=" text-sm md:text-base py-2"><Plus className="size-5" /> <span className=" hidden sm:block">Add Member</span></Button>
                                </DialogTrigger>
                                <AddNewMemberModal></AddNewMemberModal>
                            </form>
                        </Dialog>
                    
                {/* </div> */}
            </div>
            <div className=" flex items-center justify-between">
                {/* <div className="flex gap-3">
                    <div className="flex  bg-[#f6f7f9] dark:bg-darkSecondaryBg rounded-lg overflow-hidden">
                        {["Teams", "Members"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Teams" | "Members")}
                                className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                                    ? "bg-white text-headingTextColor shadow-sm dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                                    : "text-gray-600 hover:text-gray-800 dark:text-darkTextPrimary"
                                    }`}
                            >
                                {tab} (12)
                            </button>
                        ))}
                    </div>
                </div> */}
                <SearchBar onSearch={handleSearch} />
            </div>
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
                <TeamsMemberTable></TeamsMemberTable>
         
                {/* <TeamsMemberTableSkeleton></TeamsMemberTableSkeleton> */}
            
        </div >
    );
};

export default TeamsPage;