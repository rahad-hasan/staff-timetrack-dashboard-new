"use client"
import SearchBar from "@/components/Common/SearchBar";
import ArchivedProjectTable from "@/components/ProjectManagement/Projects/ArchivedProjectTable";
import ProjectTable from "@/components/ProjectManagement/Projects/ProjectTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Suspense, useState } from "react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog";
import AddProjectModal from "@/components/ProjectManagement/Projects/AddProjectModal";
import HeadingComponent from "@/components/Common/HeadingComponent";
import ProjectTableSkeleton from "@/skeleton/projectManagement/project/ProjectTableSkeleton";
import { IProject } from "@/global/globalTypes";
import { useRouter, useSearchParams } from "next/navigation";

const ProjectsPage = ({ data }: { data: IProject[] }) => {
    const [activeTab, setActiveTab] = useState<"Active" | "Archived">("Active");

    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSearch = (query: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("search", query);
        router.push(`?${params.toString()}`);
    };

    const handleTabClick = (tab: "Active" | "Archived") => {
        setActiveTab(tab);
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-2 md:mb-5">
                <HeadingComponent heading="Projects" subHeading="All the projects during the working hour by team member is here"></HeadingComponent>

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
                    <div className="inline-flex mt-3 sm:mt-0 h-10 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg">
                        {["Active", "Archived"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Active" | "Archived")}
                                className={`px-3 py-2 text-[13px] sm:text-sm font-medium transition-all cursor-pointer rounded-lg ${activeTab === tab
                                    ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor outline-1 outline-borderColor dark:outline-darkBorder shadow"
                                    : "text-subTextColor dark:text-darkTextPrimary hover:text-gray-800"
                                    } flex-shrink-0`} // Ensure buttons shrink to fit content
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                <SearchBar onSearch={handleSearch} />
            </div>
            {
                activeTab === "Active" &&
                <Suspense fallback={<ProjectTableSkeleton />}>
                    <ProjectTable data={data} />
                </Suspense>
            }
            {/* {
                activeTab === "Active" &&
                <ProjectTableSkeleton></ProjectTableSkeleton>
            } */}
            {
                activeTab === "Archived" &&
                <ArchivedProjectTable></ArchivedProjectTable>
            }
            {/* {
                activeTab === "Archived" &&
                <ArchivedProjectTableSkeleton></ArchivedProjectTableSkeleton>
            } */}
        </div>
    );
};

export default ProjectsPage;