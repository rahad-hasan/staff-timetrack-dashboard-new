"use client"
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
// import { useState } from "react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react";
import AddNewMemberModal from "./AddNewMemberModal";
import SearchBar from "../Common/SearchBar";
import HeadingComponent from "../Common/HeadingComponent";
import { useRouter, useSearchParams } from "next/navigation";

const MemberHeroSection = () => {
    const [open, setOpen] = useState(false)
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSearch = (query: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("search", query);
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    // const handlePageChange = (page: number) => {
    //     const params = new URLSearchParams(searchParams.toString());
    //     params.set("page", String(page));
    //     router.push(`?${params.toString()}`);
    // };
    
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
                <Dialog open={open} onOpenChange={setOpen}>
                    <form>
                        <DialogTrigger asChild>
                            <Button className=" text-sm md:text-base py-2"><Plus className="size-5" /> <span className=" hidden sm:block">Add Member</span></Button>
                        </DialogTrigger>
                        <AddNewMemberModal onClose={() => setOpen(false)}></AddNewMemberModal>
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
        </div>
    );
};

export default MemberHeroSection;