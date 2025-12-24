"use client"
import HeadingComponent from "@/components/Common/HeadingComponent";
import LeaveDataTable from "@/components/LeaveManagement/LeaveDetails/LeaveDataTable";
import LeaveRequestModal from "@/components/LeaveManagement/LeaveDetails/LeaveRequestModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
// import LeaveDetailsSkeleton from "@/skeleton/leaveManagement/leaveDetailsSkeleton";
import { Plus } from "lucide-react";
import { useState } from "react";

const LeaveDetails = () => {
    const [open, setOpen] = useState(false)
    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <HeadingComponent heading="Leave Management" subHeading="All the teams member leave details are displayed here"></HeadingComponent>

                <div className="">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <form>
                            <DialogTrigger asChild>
                                <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Leave request</span></Button>
                            </DialogTrigger>
                            <LeaveRequestModal onClose={() => setOpen(false)}></LeaveRequestModal>
                        </form>
                    </Dialog>
                </div>
            </div>
            {/* <div className=" mt-4 grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 w-full 2xl:w-[70%]">
                <div className=" border border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg rounded-xl w-full">
                    <h2 className="text-headingTextColor py-7 sm:py-10 bg-[#fff5db] dark:bg-darkSecondaryBg text-5xl font-extrabold text-center border-b border-borderColor dark:border-darkBorder rounded-t-xl dark:text-darkTextPrimary">30</h2>
                    <div className=" text-sm sm:text-base text-center py-2 text-headingTextColor dark:text-darkTextPrimary dark:bg-darkPrimaryBg rounded-b-xl">Yearly Paid Leave</div>
                </div>
                <div className=" border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <h2 className="text-headingTextColor py-7 sm:py-10 bg-[#eff7fe] dark:bg-darkSecondaryBg text-4xl font-extrabold text-center border-b border-borderColor dark:border-darkBorder rounded-t-xl dark:text-darkTextPrimary">14</h2>
                    <div className=" text-sm sm:text-base text-center py-2 text-headingTextColor dark:text-darkTextPrimary dark:bg-darkPrimaryBg rounded-b-xl">Sick Leave</div>
                </div>
                <div className=" border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <h2 className="text-headingTextColor py-7 sm:py-10 bg-[#ede7ff] dark:bg-darkSecondaryBg text-5xl font-extrabold text-center border-b border-borderColor dark:border-darkBorder rounded-t-xl dark:text-darkTextPrimary">14</h2>
                    <div className=" text-sm sm:text-base text-center py-2 text-headingTextColor dark:text-darkTextPrimary dark:bg-darkPrimaryBg rounded-b-xl">Yearly Casual Leave</div>
                </div>
                <div className=" border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <h2 className="text-headingTextColor py-7 sm:py-10 bg-[#fee6eb] dark:bg-darkSecondaryBg text-5xl font-extrabold text-center border-b border-borderColor dark:border-darkBorder rounded-t-xl dark:text-darkTextPrimary">4</h2>
                    <div className=" text-sm sm:text-base text-center py-2 text-headingTextColor dark:text-darkTextPrimary dark:bg-darkPrimaryBg rounded-b-xl">Maternity leave</div>
                </div>
            </div> */}
            <div className="  mt-4 grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 w-full 2xl:w-[70%]">
                <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <div className="h-[90px] 2xl:h-[105px] bg-[#fff5db] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4 ">
                        <h2 className=" text-3xl sm:text-4xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">30</h2>
                    </div>
                    <div className=" h-[40px] 2xl:h-[45px] text-sm sm:text-base flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Yearly Paid Leave</div>
                </div>
                <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <div className="h-[90px] 2xl:h-[105px] bg-[#eff7fe] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4">
                        <h2 className=" text-3xl sm:text-4xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">14</h2>
                    </div>
                    <div className=" h-[40px] 2xl:h-[45px] text-sm sm:text-base flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Sick Leave</div>
                </div>
                <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <div className="h-[90px] 2xl:h-[105px] bg-[#ede7ff] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4">
                        <h2 className=" text-3xl sm:text-4xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">14</h2>
                    </div>
                    <div className=" h-[40px] 2xl:h-[45px] text-sm sm:text-base flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Yearly Casual Leave</div>
                </div>
                <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <div className="h-[90px] 2xl:h-[105px] bg-[#fee6eb] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4">
                        <h2 className=" text-3xl sm:text-4xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">4</h2>
                    </div>
                    <div className=" h-[40px] 2xl:h-[45px] text-sm sm:text-base flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Maternity leave</div>
                </div>
            </div>
            <LeaveDataTable></LeaveDataTable>
            {/* <LeaveDetailsSkeleton /> */}
        </div>
    );
};

export default LeaveDetails;