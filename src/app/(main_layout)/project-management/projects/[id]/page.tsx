"use client"
import ProjectMemberTable from "@/components/ProjectManagement/Projects/ProjectMemberTable";
import TaskTable from "@/components/ProjectManagement/Task/TaskTable";
import { Button } from "@/components/ui/button";
// import SingleProjectClientInfoSkeleton from "@/skeleton/projectManagement/project/SingleProjectClientInfoSkeleton";
import { ChevronDown, ChevronLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const SingleProjectPage = () => {
    const [activeTab, setActiveTab] = useState<"Members" | "Tasks">("Members");

    const handleTabClick = (tab: "Members" | "Tasks") => {
        setActiveTab(tab);
    };

    return (
        <div>
            <div className=" flex justify-between items-center">
                <Link href={`/project-management/projects`}>
                    <div className="hidden sm:flex items-center gap-1 cursor-pointer "><ChevronLeft className="" /> Projects</div>
                </Link>
                <div className=" flex gap-3">
                    <Button className="text-sm md:text-base bg-[#eff7fe] hover:bg-[#eff7fe] text-[#5db0f1] border border-[#5db0f1]">
                        <span className="w-2 h-2 bg-[#5db0f1] rounded-full"></span> In Progress <ChevronDown />
                    </Button>
                    <Button className=" text-sm md:text-base" variant={'outline2'}><Pencil /> Edit Project</Button>
                </div>
            </div>

            <div className="mt-4 xl:w-[80%] 2xl:w-[70%]">
                <div className=" ">
                    <h2 className=" text-lg font-semibold">Orbit Management Project</h2>
                    <p className="mt-2 text-textGray">Lorem ipsum dolor sit amet consectetur adipisicing elit. Facere explicabo autem dolorem deserunt minus voluptatem enim sit quidem repellat accusamus soluta, delectus cumque facilis, doloremque esse possimus, adipisci odio tempora architecto quos. Similique sequi impedit debitis autem quaerat exercitationem, dolorum, cumque, quis et laborum ratione sit sapiente aliquam praesentium enim.</p>
                </div>

                <div className="mt-4 w-full overflow-x-auto">
                    <table className="min-w-[600px] w-full border-collapse text-sm md:text-base">
                        <thead className="">
                            <tr>
                                <th className="text-left py-2 px-3 whitespace-nowrap">Client</th>
                                <th className="text-left py-2 px-3 whitespace-nowrap">Phone</th>
                                <th className="text-left py-2 px-3 whitespace-nowrap">Starting Date</th>
                                <th className="text-left py-2 px-3 whitespace-nowrap">Deadline</th>
                                <th className="text-left py-2 px-3 whitespace-nowrap">Project Bill</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="">
                                <td className="py-2 px-3 whitespace-nowrap">Daniel Vector</td>
                                <td className="py-2 px-3 whitespace-nowrap">+880 - 1324 4524 452</td>
                                <td className="py-2 px-3 whitespace-nowrap">12 Aug, 2025</td>
                                <td className="py-2 px-3 whitespace-nowrap">12 Aug, 2025</td>
                                <td className="py-2 px-3 whitespace-nowrap">Hourly: $35</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className=" mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-center gap-6">
                    <div className=" border border-borderColor rounded-xl w-full">
                        <h2 className=" py-10 bg-[#fff5db] text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl">420 hours</h2>
                        <div className=" text-center py-2">Total Hours</div>
                    </div>
                    <div className=" border border-borderColor rounded-xl w-full">
                        <h2 className=" py-10 bg-[#eff7fe] text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl">180 hours</h2>
                        <div className=" text-center py-2">Billable Hours</div>
                    </div>
                    <div className=" border border-borderColor rounded-xl w-full">
                        <h2 className=" py-10 bg-[#ede7ff] text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl">240 hours</h2>
                        <div className=" text-center py-2">Unbilled Hours</div>
                    </div>
                    <div className=" border border-borderColor rounded-xl w-full">
                        <h2 className=" py-10 bg-[#fee6eb] text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl">$6,302</h2>
                        <div className=" text-center py-2">Unbilled Amount</div>
                    </div>
                </div>
            </div>

            {/* <SingleProjectClientInfoSkeleton></SingleProjectClientInfoSkeleton> */}

            <div className=" flex flex-col sm:flex-row items-start gap-3 sm:items-center sm:justify-between mt-4">
                <div className="flex gap-3">
                    <div className="flex mt-3 sm:mt-0 bg-[#f6f7f9] rounded-lg overflow-hidden">
                        {["Members", "Tasks"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Members" | "Tasks")}
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
                    activeTab === "Members" ?
                        <Button className=" text-sm md:text-base"><Plus /> Add Member</Button>
                        :
                        <Button className=" text-sm md:text-base"><Plus /> Add Task</Button>
                }
            </div>
            {
                activeTab === "Members" ?
                    <ProjectMemberTable></ProjectMemberTable>
                    :
                    <TaskTable></TaskTable>
            }
        </div>
    );
};

export default SingleProjectPage;