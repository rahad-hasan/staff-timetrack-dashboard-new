"use client"
import ProjectTable from "@/components/ProjectManagement/Projects/ProjectTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

const Projects = () => {
    const [activeTab, setActiveTab] = useState<"Active" | "Archived">("Active");

    const handleTabClick = (tab: "Active" | "Archived") => {
        setActiveTab(tab);
    };


    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-semibold text-headingTextColor">Projects</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the projects during the working hour by team member is here
                    </p>
                </div>

                <div className="">
                    <Button><Plus size={20} />Add Project</Button>
                </div>
            </div>
            <div className="flex gap-3">
                <div className="flex mt-3 sm:mt-0 bg-[#f6f7f9] rounded-lg overflow-hidden">
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
            {
                activeTab === "Active" &&
                <ProjectTable></ProjectTable>
            }
        </div>
    );
};

export default Projects;