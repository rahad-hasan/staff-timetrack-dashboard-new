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
                    <Button variant={'outline2'}><Pencil />Edit Client</Button>
                </div>
            </div>

            <div className="mt-4 w-[70%]">
                <div className=" mt-4 ">
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="">
                                <th className="text-left py-1">Client</th>
                                <th className="text-left py-1">Phone</th>
                                <th className="text-left py-1">Email</th>
                                <th className="text-left py-1">Address</th>
                                <th className="text-left py-1">Client Since</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-1">Daniel Vector</td>
                                <td className="py-1">+880 - 1324 4524 452</td>
                                <td className="py-1">orbitagency@gmail.com</td>
                                <td className="py-1">Dhaka, Bangladesh</td>
                                <td className="py-1">12 Jan, 2021</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className=" mt-4 flex items-center gap-6">
                    <div className=" border border-borderColor rounded-xl w-full">
                        <h2 className=" py-10 bg-[#fff5db] text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl">06</h2>
                        <div className=" text-center py-2">Total Project</div>
                    </div>
                    <div className=" border border-borderColor rounded-xl w-full">
                        <h2 className=" py-10 bg-[#eff7fe] text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl">5</h2>
                        <div className=" text-center py-2">Completed Project</div>
                    </div>
                    <div className=" border border-borderColor rounded-xl w-full">
                        <h2 className=" py-10 bg-[#ede7ff] text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl">$4,302</h2>
                        <div className=" text-center py-2">Total Paid</div>
                    </div>
                    <div className=" border border-borderColor rounded-xl w-full">
                        <h2 className=" py-10 bg-[#fee6eb] text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl">$6,302</h2>
                        <div className=" text-center py-2">Unbilled Amount</div>
                    </div>
                </div>
            </div>

            <div className=" flex items-center justify-between mt-4">
                <h2 className=" text-lg font-semibold">Project (12)</h2>
                <Button><Plus /> Add Project</Button>

            </div>
            <ProjectTable></ProjectTable>
        </div>
    );
};

export default SingleClientPage;