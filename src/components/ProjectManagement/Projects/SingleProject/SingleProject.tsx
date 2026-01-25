"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ISingleProjectData } from "@/types/type";
import { ChevronLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import SingleProjectMemberTable from "./SingleProjectMemberTable";
import SingleProjectTask from "./SingleProjectTask";
import { Dialog } from "@/components/ui/dialog";
import EditProjectModal from "@/components/ProjectManagement/Projects/EditProjectModal";
import { formatTZDateDMY } from "@/utils";

const SingleProject = ({ data }: { data: ISingleProjectData }) => {
    const [activeTab, setActiveTab] = useState<"Members" | "Tasks">("Members");
    const [open, setOpen] = useState(false)
    const handleTabClick = (tab: "Members" | "Tasks") => {
        setActiveTab(tab);
    };
    const statusClass =
        data?.status === "processing"
            ? "bg-[#fff5db] border-[#efaf07] text-[#efaf07] hover:bg-[#fff5db] dark:bg-transparent"
            : data?.status === "cancelled"
                ? "bg-[#fee6eb] border-[#f40139] text-[#f40139] hover:bg-[#fee6eb] dark:bg-transparent"
                : data?.status === "pending"
                    ? "bg-[#eff7fe] border-[#5db0f1] text-[#5db0f1] hover:bg-[#eff7fe] dark:bg-transparent"
                    : "bg-[#e9f8f0] border-[#26bd6c] text-[#26bd6c] hover:bg-[#e9f8f0] dark:bg-transparent";
    const dotClass =
        data?.status === "processing" ? "bg-[#efaf07]" :
            data?.status === "cancelled" ? "bg-[#f40139]" :
                data?.status === "pending" ? "bg-[#5db0f1]" : "bg-[#26bd6c]";

    return (
        <div>
            <div className=" flex justify-between items-center">
                <Link href={`/project-management/projects`}>
                    <div className="hidden sm:flex items-center gap-1 cursor-pointer "><ChevronLeft className="" /> Projects</div>
                </Link>
                <div className=" flex gap-3">
                    <Button
                        className={`text-sm md:text-base border flex items-center gap-2 px-4 cursor-default ${statusClass} capitalize`}
                    >
                        <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
                        {data?.status}
                    </Button>
                    <Button className=" text-sm md:text-base dark:text-darkTextPrimary" onClick={() => setOpen(true)} variant={'outline2'}><Pencil /> Edit Project</Button>
                </div>
            </div>

            <div className="mt-4 xl:w-[80%] 2xl:w-[70%]">
                <div className=" ">
                    <h2 className=" text-lg font-bold text-headingTextColor dark:text-darkTextPrimary">{data?.name}</h2>
                    <p className="mt-2 text-subTextColor dark:text-darkTextSecondary">{data?.description}</p>
                </div>

                <div className="mt-4 w-full overflow-x-auto">
                    <table className="min-w-[600px] w-full border-collapse text-sm md:text-base">
                        <thead className="">
                            <tr>
                                <th className="text-left py-0.5 whitespace-nowrap text-headingTextColor dark:text-darkTextPrimary">Client</th>
                                <th className="text-left py-0.5 whitespace-nowrap text-headingTextColor dark:text-darkTextPrimary">Phone</th>
                                <th className="text-left py-0.5 whitespace-nowrap text-headingTextColor dark:text-darkTextPrimary">Starting Date</th>
                                <th className="text-left py-0.5 whitespace-nowrap text-headingTextColor dark:text-darkTextPrimary">Deadline</th>
                                <th className="text-left py-0.5 whitespace-nowrap text-headingTextColor dark:text-darkTextPrimary">Project Budget</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="">
                                <td className="py-0.5 whitespace-nowrap text-subTextColor dark:text-darkTextSecondary">{data?.client?.name}</td>
                                <td className="py-0.5 whitespace-nowrap text-subTextColor dark:text-darkTextSecondary">{data?.client?.phone}</td>
                                <td className="py-0.5 whitespace-nowrap text-subTextColor dark:text-darkTextSecondary">{data?.start_date ? formatTZDateDMY(data.start_date) : "N/A"}</td>
                               
                                <td className="py-0.5 whitespace-nowrap text-subTextColor dark:text-darkTextSecondary">{data?.deadline ? formatTZDateDMY(data?.deadline) : "N/A"}</td>
                                <td className="py-0.5 whitespace-nowrap text-subTextColor dark:text-darkTextSecondary">${data?.budget}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* <div className=" mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-center gap-6">
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
                </div> */}
                <div className=" mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-center gap-6">
                    {
                        data?.projectManagerAssigns?.map((manager) =>
                            <div key={manager?.user?.id} className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                                <div className="h-[90px] 2xl:h-[105px] bg-[#f6f7f9] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start gap-1 rounded-t-xl px-4 ">
                                    <Avatar>
                                        <AvatarImage
                                            src={manager?.user?.image ? manager?.user?.image : ""}
                                            alt={manager?.user?.name}
                                        />
                                        <AvatarFallback className=" bg-primary dark:bg-primary text-white">{manager?.user?.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <h2>{manager?.user?.name}</h2>
                                </div>
                                <div className=" h-[40px] 2xl:h-[45px] flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Project Manage</div>
                            </div>
                        )
                    }
                    <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                        <div className="h-[90px] 2xl:h-[105px] bg-[#f6f7f9] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4">
                            <h2 className=" text-2xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">{data?.summary?.duration}</h2>
                        </div>
                        <div className=" h-[40px] 2xl:h-[45px] flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Duration</div>
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
                {/* {
                    activeTab === "Members" ?
                        <Button className=" text-sm md:text-base"><PlusIcon size={20} /> Add Member</Button>
                        :
                        <Button className=" text-sm md:text-base"><PlusIcon size={20} /> Add Task</Button>
                } */}
            </div>
            {
                activeTab === "Members" ?
                    <SingleProjectMemberTable data={data?.projectAssigns}></SingleProjectMemberTable>
                    :
                    <SingleProjectTask data={data?.tasks}></SingleProjectTask>
            }
            {/* Edit modal here */}
            <Dialog open={open} onOpenChange={setOpen}>
                <EditProjectModal
                    onClose={() => setOpen(false)}
                    selectedProject={data}
                />
            </Dialog>
        </div>
    );
};

export default SingleProject;