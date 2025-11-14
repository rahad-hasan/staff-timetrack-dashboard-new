import HeadingComponent from "@/components/Common/HeadingComponent";
import LeaveDataTable from "@/components/LeaveManagement/LeaveDetails/LeaveDataTable";
import LeaveRequestModal from "@/components/LeaveManagement/LeaveDetails/LeaveRequestModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
// import LeaveDetailsSkeleton from "@/skeleton/leaveManagement/leaveDetailsSkeleton";
import { Plus } from "lucide-react";

const LeaveDetails = () => {
    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <HeadingComponent heading="Leave Management" subHeading="All the teams member leave details are displayed here"></HeadingComponent>

                <div className="">
                    <Dialog>
                        <form>
                            <DialogTrigger asChild>
                                <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Leave request</span></Button>
                            </DialogTrigger>
                            <LeaveRequestModal></LeaveRequestModal>
                        </form>
                    </Dialog>
                </div>
            </div>
            <div className=" mt-4 grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 w-full 2xl:w-[70%]">
                <div className=" border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <h2 className="text-headingTextColor py-7 sm:py-10 bg-[#fff5db] text-3xl font-semibold text-center border-b border-borderColor dark:border-darkBorder rounded-t-xl dark:text-darkSecondaryBg">30</h2>
                    <div className=" text-sm sm:text-base text-center py-2 text-headingTextColor dark:text-darkTextPrimary">Yearly Paid Leave</div>
                </div>
                <div className=" border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <h2 className="text-headingTextColor py-7 sm:py-10 bg-[#eff7fe] text-3xl font-semibold text-center border-b border-borderColor dark:border-darkBorder rounded-t-xl dark:text-darkSecondaryBg">14</h2>
                    <div className=" text-sm sm:text-base text-center py-2 text-headingTextColor dark:text-darkTextPrimary">Public Holiday</div>
                </div>
                <div className=" border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <h2 className="text-headingTextColor py-7 sm:py-10 bg-[#ede7ff] text-3xl font-semibold text-center border-b border-borderColor dark:border-darkBorder rounded-t-xl dark:text-darkSecondaryBg">14</h2>
                    <div className=" text-sm sm:text-base text-center py-2 text-headingTextColor dark:text-darkTextPrimary">Yearly Casual Leave</div>
                </div>
                <div className=" border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <h2 className="text-headingTextColor py-7 sm:py-10 bg-[#fee6eb] text-3xl font-semibold text-center border-b border-borderColor dark:border-darkBorder rounded-t-xl dark:text-darkSecondaryBg">4</h2>
                    <div className=" text-sm sm:text-base text-center py-2 text-headingTextColor dark:text-darkTextPrimary">Team member on leave</div>
                </div>
            </div>
            <LeaveDataTable></LeaveDataTable>
            {/* <LeaveDetailsSkeleton /> */}
        </div>
    );
};

export default LeaveDetails;