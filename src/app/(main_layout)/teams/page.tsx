"use client"
import SearchBar from "@/components/Common/SearchBar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import TeamsTable from "@/components/Teams/TeamsTable";
import AddTeamModal from "@/components/Teams/AddTeamModal";
import TeamsMemberTable from "@/components/Teams/TeamsMemberTable";
import AddNewMemberModal from "@/components/Teams/AddNewMemberModal";

const TeamsPage = () => {
    const [activeTab, setActiveTab] = useState<"Teams" | "Members">("Teams");

    const handleTabClick = (tab: "Teams" | "Members") => {
        setActiveTab(tab);
    };
    const handleSearch = (query: string) => {
        console.log("Searching for:", query);
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className=" text-2xl md:text-3xl font-semibold text-headingTextColor">Teams</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the teams and member are displayed here
                    </p>
                </div>

                <div className="">
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
                        activeTab === "Members" &&
                        <Dialog>
                            <form>
                                <DialogTrigger asChild>
                                    <Button className=" text-sm md:text-base py-2"><Plus className="size-5" /> <span className=" hidden sm:block">Add Member</span></Button>
                                </DialogTrigger>
                                <AddNewMemberModal></AddNewMemberModal>
                            </form>
                        </Dialog>
                    }
                </div>
            </div>
            <div className=" flex items-center justify-between">
                <div className="flex gap-3">
                    <div className="flex  bg-[#f6f7f9] rounded-lg overflow-hidden">
                        {["Teams", "Members"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Teams" | "Members")}
                                className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                                    ? "bg-white text-headingTextColor shadow-sm"
                                    : "text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                {tab} (12)
                            </button>
                        ))}
                    </div>
                </div>
                <SearchBar onSearch={handleSearch} />
            </div>
            {
        activeTab === "Teams" &&
            <TeamsTable></TeamsTable>
    }
    {
        activeTab === "Members" &&
            <TeamsMemberTable></TeamsMemberTable>
    }
        </div >
    );
};

export default TeamsPage;