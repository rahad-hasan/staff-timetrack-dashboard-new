import LeaveDataTable from "@/components/LeaveManagement/LeaveDetails/LeaveDataTable";
import LeaveRequestModal from "@/components/LeaveManagement/LeaveDetails/LeaveRequestModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const LeaveDetails = () => {
    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-semibold text-headingTextColor">Leave Management</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the teams member leave details are displayed here
                    </p>
                </div>

                <div className="">
                    <Dialog>
                        <form>
                            <DialogTrigger asChild>
                    <Button><Plus size={20} />Leave request</Button>
                    </DialogTrigger>
                            <LeaveRequestModal></LeaveRequestModal>
                        </form>
                    </Dialog>
                </div>
            </div>
            <div className=" mt-4 flex items-center gap-6 w-[70%]">
                <div className=" border border-borderColor rounded-xl w-full">
                    <h2 className=" py-10 bg-[#fff5db] text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl">30</h2>
                    <div className=" text-center py-2">Yearly Paid Leave</div>
                </div>
                <div className=" border border-borderColor rounded-xl w-full">
                    <h2 className=" py-10 bg-[#eff7fe] text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl">14</h2>
                    <div className=" text-center py-2">Public Holiday</div>
                </div>
                <div className=" border border-borderColor rounded-xl w-full">
                    <h2 className=" py-10 bg-[#ede7ff] text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl">14</h2>
                    <div className=" text-center py-2">Yearly Casual Leave</div>
                </div>
                <div className=" border border-borderColor rounded-xl w-full">
                    <h2 className=" py-10 bg-[#fee6eb] text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl">4</h2>
                    <div className=" text-center py-2">Team member on leave</div>
                </div>
            </div>
            <LeaveDataTable></LeaveDataTable>
        </div>
    );
};

export default LeaveDetails;