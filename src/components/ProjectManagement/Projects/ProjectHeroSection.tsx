"use client"
import SearchBar from "@/components/Common/SearchBar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog";
import AddProjectModal from "@/components/ProjectManagement/Projects/AddProjectModal";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const ProjectHeroSection = () => {
    const [open, setOpen] = useState(false)
    type Tab = "active" | "archived";
    const router = useRouter();
    const searchParams = useSearchParams();
    const handleSearch = (query: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("search", query);
        router.push(`?${params.toString()}`);
    };

    const activeTab = (searchParams.get("tab") as Tab) ?? "active";
    const setTab = (tab: Tab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        params.set("page", "1"); // reset pagination if needed
        router.push(`?${params.toString()}`);
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-2 md:mb-5">
                <HeadingComponent heading="Projects" subHeading="All the projects during the working hour by team member is here"></HeadingComponent>

                <div className="">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <form>
                            <DialogTrigger asChild>
                                <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add Project</span></Button>
                            </DialogTrigger>
                            <AddProjectModal onClose={() => setOpen(false)}></AddProjectModal>
                        </form>
                    </Dialog>
                </div>
            </div>
            <div className=" flex gap-3 items-center justify-between mt-3 sm:mt-0">
                <div className="flex gap-3">
                    <div className="inline-flex mt-3 sm:mt-0 h-10 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg">
                        {["active", "archived"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setTab(tab as "active" | "archived")}
                                className={`px-3 py-2 text-[13px] sm:text-sm font-medium transition-all cursor-pointer rounded-lg ${activeTab === tab
                                    ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor outline-1 outline-borderColor dark:outline-darkBorder shadow"
                                    : "text-subTextColor dark:text-darkTextPrimary hover:text-gray-800"
                                    } flex-shrink-0 capitalize`} // Ensure buttons shrink to fit content
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                <SearchBar onSearch={handleSearch} />
            </div>
        </div>
    );
};

export default ProjectHeroSection;