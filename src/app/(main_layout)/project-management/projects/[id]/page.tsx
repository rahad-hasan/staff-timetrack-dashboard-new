"use client"
import PlusIcon from "@/components/Icons/PlusIcon";
import ProjectMemberTable from "@/components/ProjectManagement/Projects/ProjectMemberTable";
import TaskTable from "@/components/ProjectManagement/Task/TaskTable";
import { Button } from "@/components/ui/button";
// import SingleProjectClientInfoSkeleton from "@/skeleton/projectManagement/project/SingleProjectClientInfoSkeleton";
import { ChevronDown, ChevronLeft, Pencil } from "lucide-react";
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
                    <Button className="text-sm md:text-base bg-[#eff7fe] hover:bg-[#eff7fe] dark:bg-darkPrimaryBg text-[#5db0f1] border border-[#5db0f1]">
                        <span className="w-2 h-2 bg-[#5db0f1] rounded-full"></span> In Progress <ChevronDown />
                    </Button>
                    <Button className=" text-sm md:text-base dark:text-darkTextPrimary" variant={'outline2'}><Pencil /> Edit Project</Button>
                </div>
            </div>

            <div className="mt-4 xl:w-[80%] 2xl:w-[70%]">
                <div className=" ">
                    <h2 className=" text-lg font-bold text-headingTextColor dark:text-darkTextPrimary">Orbit Management Project</h2>
                    <p className="mt-2 text-subTextColor dark:text-darkTextSecondary">Lorem ipsum dolor sit amet consectetur adipisicing elit. Facere explicabo autem dolorem deserunt minus voluptatem enim sit quidem repellat accusamus soluta, delectus cumque facilis, doloremque esse possimus, adipisci odio tempora architecto quos. Similique sequi impedit debitis autem quaerat exercitationem, dolorum, cumque, quis et laborum ratione sit sapiente aliquam praesentium enim.</p>
                </div>

                <div className="mt-4 w-full overflow-x-auto">
                    <table className="min-w-[600px] w-full border-collapse text-sm md:text-base">
                        <thead className="">
                            <tr>
                                <th className="text-left py-0.5 whitespace-nowrap text-headingTextColor dark:text-darkTextPrimary">Client</th>
                                <th className="text-left py-0.5 whitespace-nowrap text-headingTextColor dark:text-darkTextPrimary">Phone</th>
                                <th className="text-left py-0.5 whitespace-nowrap text-headingTextColor dark:text-darkTextPrimary">Starting Date</th>
                                <th className="text-left py-0.5 whitespace-nowrap text-headingTextColor dark:text-darkTextPrimary">Deadline</th>
                                <th className="text-left py-0.5 whitespace-nowrap text-headingTextColor dark:text-darkTextPrimary">Project Bill</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="">
                                <td className="py-0.5 whitespace-nowrap text-subTextColor dark:text-darkTextSecondary">Daniel Vector</td>
                                <td className="py-0.5 whitespace-nowrap text-subTextColor dark:text-darkTextSecondary">+880 - 1324 4524 452</td>
                                <td className="py-0.5 whitespace-nowrap text-subTextColor dark:text-darkTextSecondary">12 Aug, 2025</td>
                                <td className="py-0.5 whitespace-nowrap text-subTextColor dark:text-darkTextSecondary">12 Aug, 2025</td>
                                <td className="py-0.5 whitespace-nowrap text-subTextColor dark:text-darkTextSecondary">Hourly: $35</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className=" mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-center gap-6">
                    <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                        <div className="h-[90px] 2xl:h-[105px] bg-[#fff5db] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4 ">
                            <h2 className=" text-2xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">420 hours</h2>
                        </div>
                        <div className=" h-[40px] 2xl:h-[45px] flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Total Hours</div>
                    </div>
                    <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                        <div className="h-[90px] 2xl:h-[105px] bg-[#eff7fe] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4">
                            <h2 className=" text-2xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">180 hours</h2>
                        </div>
                        <div className=" h-[40px] 2xl:h-[45px] flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Billable Hours</div>
                    </div>
                    <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                        <div className="h-[90px] 2xl:h-[105px] bg-[#ede7ff] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4">
                            <h2 className=" text-2xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">240 hours</h2>
                        </div>
                        <div className=" h-[40px] 2xl:h-[45px] flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Unbilled Hours</div>
                    </div>
                    <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                        <div className="h-[90px] 2xl:h-[105px] bg-[#fee6eb] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4">
                            <h2 className=" text-2xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">$6,302</h2>
                        </div>
                        <div className=" h-[40px] 2xl:h-[45px] flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Unbilled Amount</div>
                    </div>
                </div>
            </div>

            {/* <SingleProjectClientInfoSkeleton></SingleProjectClientInfoSkeleton> */}

            <div className=" flex flex-col sm:flex-row items-start gap-3 sm:items-center sm:justify-between mt-10">
                <div className="flex gap-3">
                    <div className="grid grid-cols-3 lg:flex mt-3 w-[250px] lg:w-auto sm:mt-0 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg box-border ">
                        {["Members", "Tasks"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Members" | "Tasks")}
                                className={`px-3.5 h-10 text-sm font-medium transition-all cursor-pointer rounded-lg min-w-[70px] text-center
                                ${activeTab === tab
                                        ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor outline-1 outline-borderColor dark:outline-darkBorder"
                                        : " text-headingTextColor dark:text-darkTextPrimary hover:text-gray-800"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                {
                    activeTab === "Members" ?
                        <Button className=" text-sm md:text-base"><PlusIcon size={20} /> Add Member</Button>
                        :
                        <Button className=" text-sm md:text-base"><PlusIcon size={20} /> Add Task</Button>
                }
            </div>
            {/* {
                activeTab === "Members" ?
                    <ProjectMemberTable></ProjectMemberTable>
                    :
                    <TaskTable></TaskTable>
            } */}
        </div>
    );
};

export default SingleProjectPage;