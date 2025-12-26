import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog";
import AddManualTimeModal from "@/components/TimeSheets/ManualRequests/AddManualTimeModal";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import ManualRequestTableServer from "@/components/TimeSheets/ManualRequests/ManualRequestTableServer";
import { ISearchParamsProps } from "@/types/type";

const ManualRequests = async ({ searchParams }: ISearchParamsProps) => {

    return (
        <div>
            <div className="flex items-center justify-between gap-3 md:gap-0 mb-5">
                <HeadingComponent heading="Manual Requests" subHeading="All the timesheet by team member who completed is displayed here"></HeadingComponent>

                <div className="">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add Time</span></Button>
                        </DialogTrigger>
                        <AddManualTimeModal></AddManualTimeModal>
                    </Dialog>

                </div>
            </div>
            <div className=" flex flex-col sm:flex-row justify-between items-center gap-4 md:gap-3 mb-5">
                {/* <div className="">
                    <Button className=" w-10 sm:w-auto h-10 sm:h-auto dark:text-darkTextPrimary" variant={'outline2'}>
                        <SlidersHorizontal className="" /> <span className=" hidden sm:block dark:text-darkTextPrimary">Filters</span>
                    </Button>
                </div> */}
                <SelectProjectDropDown></SelectProjectDropDown>
                <SelectUserDropDown></SelectUserDropDown>
            </div>
            <ManualRequestTableServer searchParams={searchParams}/>
            {/* <ManualRequestsSkeleton></ManualRequestsSkeleton> */}
        </div>
    );
};

export default ManualRequests;