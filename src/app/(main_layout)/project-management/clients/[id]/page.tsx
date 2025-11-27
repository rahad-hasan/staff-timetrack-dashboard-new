"use client"

import ProjectTable from "@/components/ProjectManagement/Projects/ProjectTable";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";

const SingleClientPage = () => {

    return (
        <div>
            <div className=" flex justify-between items-center">
                <Link href={`/project-management/clients`}>
                    <div className=" flex items-center gap-1 cursor-pointer"><ChevronLeft className="" />Client</div>
                </Link>
                <div className=" flex gap-3">
                    <Button className=" text-sm md:text-base dark:text-darkTextPrimary" variant={'outline2'}><Pencil />Edit Client</Button>
                </div>
            </div>

            <div className="mt-4 xl:w-[80%] 2xl:w-[70%]">
                <div className=" mt-4 w-full overflow-x-auto ">
                    <table className="min-w-[600px] w-full border-collapse text-sm md:text-base">
                        <thead>
                            <tr className="">
                                <th className="text-left py-1 text-headingTextColor dark:text-darkTextPrimary">Client</th>
                                <th className="text-left py-1 text-headingTextColor dark:text-darkTextPrimary">Phone</th>
                                <th className="text-left py-1 text-headingTextColor dark:text-darkTextPrimary">Email</th>
                                <th className="text-left py-1 text-headingTextColor dark:text-darkTextPrimary">Address</th>
                                <th className="text-left py-1 text-headingTextColor dark:text-darkTextPrimary">Client Since</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-1 text-headingTextColor dark:text-darkTextPrimary">Daniel Vector</td>
                                <td className="py-1 text-headingTextColor dark:text-darkTextPrimary">+880 - 1324 4524 452</td>
                                <td className="py-1 text-headingTextColor dark:text-darkTextPrimary">orbitagency@gmail.com</td>
                                <td className="py-1 text-headingTextColor dark:text-darkTextPrimary">Dhaka, Bangladesh</td>
                                <td className="py-1 text-headingTextColor dark:text-darkTextPrimary">12 Jan, 2021</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="  mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-center gap-6">
                    <div className=" border border-borderColor dark:border-darkBorder rounded-xl w-full">
                        <h2 className=" py-10 bg-[#fff5db] text-3xl font-medium text-center border-b border-borderColor dark:border-darkBorder rounded-t-xl text-headingTextColor  dark:text-darkSecondaryBg">06</h2>
                        <div className=" text-center py-2 text-headingTextColor dark:text-darkTextPrimary">Total Project</div>
                    </div>
                    <div className=" border border-borderColor dark:border-darkBorder rounded-xl w-full">
                        <h2 className=" py-10 bg-[#eff7fe] text-3xl font-medium text-center border-b border-borderColor dark:border-darkBorder rounded-t-xl text-headingTextColor  dark:text-darkSecondaryBg">5</h2>
                        <div className=" text-center py-2 text-headingTextColor dark:text-darkTextPrimary">Completed Project</div>
                    </div>
                    <div className=" border border-borderColor dark:border-darkBorder rounded-xl w-full">
                        <h2 className=" py-10 bg-[#ede7ff] text-3xl font-medium text-center border-b border-borderColor dark:border-darkBorder rounded-t-xl text-headingTextColor  dark:text-darkSecondaryBg">$4,302</h2>
                        <div className=" text-center py-2 text-headingTextColor dark:text-darkTextPrimary">Total Paid</div>
                    </div>
                    <div className=" border border-borderColor dark:border-darkBorder rounded-xl w-full">
                        <h2 className=" py-10 bg-[#fee6eb] text-3xl font-medium text-center border-b border-borderColor dark:border-darkBorder rounded-t-xl text-headingTextColor  dark:text-darkSecondaryBg">$6,302</h2>
                        <div className=" text-center py-2 text-headingTextColor dark:text-darkTextPrimary">Unbilled Amount</div>
                    </div>
                </div>
            </div>

            <div className=" flex items-center justify-between mt-4">
                <h2 className=" text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">Project (12)</h2>
                <Button className=" text-sm md:text-base"><Plus /> Add Project</Button>

            </div>
            <ProjectTable></ProjectTable>
        </div>
    );
};

export default SingleClientPage;