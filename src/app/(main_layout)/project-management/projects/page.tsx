"use client"
import SearchBar from "@/components/Common/SearchBar";
import ArchivedProjectTable from "@/components/ProjectManagement/Projects/ArchivedProjectTable";
import ProjectTable from "@/components/ProjectManagement/Projects/ProjectTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AddProjectModal from "@/components/ProjectManagement/Projects/AddProjectModal";

const Projects = () => {
    console.log("Projects");
    const [activeTab, setActiveTab] = useState<"Active" | "Archived">("Active");

    const handleTabClick = (tab: "Active" | "Archived") => {
        setActiveTab(tab);
    };
    const handleSearch = (query: string) => {
        console.log("Searching for:", query);
        // Call your API, filter data, etc.
    };
    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-2 md:mb-5">
                <div>
                    <h1 className=" text-2xl md:text-3xl font-semibold text-headingTextColor">Projects</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the projects during the working hour by team member is here
                    </p>
                </div>

                <div className="">
                    <Dialog>
                        <form>
                            <DialogTrigger asChild>
                                <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add Project</span></Button>
                            </DialogTrigger>
                            <AddProjectModal></AddProjectModal>
                        </form>
                    </Dialog>
                </div>
            </div>
            <div className=" flex gap-3 items-center justify-between mt-3 sm:mt-0">
                <div className="flex gap-3">
                    <div className="flex bg-[#f6f7f9] rounded-lg overflow-hidden">
                        {["Active", "Archived"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Active" | "Archived")}
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
                activeTab === "Active" &&
                <ProjectTable></ProjectTable>
            }
            {
                activeTab === "Archived" &&
                <ArchivedProjectTable></ArchivedProjectTable>
            }
        </div>
    );
};

export default Projects;