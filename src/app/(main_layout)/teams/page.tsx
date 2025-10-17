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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-semibold text-headingTextColor">Teams</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the teams and member are displayed here
                    </p>
                </div>

                <div className="">
                    <Dialog>
                        <form>
                            <DialogTrigger asChild>
                                <Button><Plus size={20} />Add Team</Button>
                            </DialogTrigger>
                            <AddTeamModal></AddTeamModal>
                        </form>
                    </Dialog>
                </div>
            </div>
            <div className=" flex items-center justify-between">
                <div className="flex gap-3">
                    <div className="flex mt-3 sm:mt-0 bg-[#f6f7f9] rounded-lg overflow-hidden">
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
        </div>
    );
};

export default TeamsPage;