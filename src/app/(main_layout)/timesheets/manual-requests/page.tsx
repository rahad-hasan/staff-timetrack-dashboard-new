import ManualRequestsTable from "@/components/TimeSheets/ManualRequests/ManualRequestsTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AddManualTimeModal from "@/components/TimeSheets/ManualRequests/AddManualTimeModal";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
// import ManualRequestsSkeleton from "@/skeleton/timesheets/manualRequest/ManualRequestsSkeleton";

const ManualRequests = () => {
    const projects = [
        {
            value: "Time Tracker",
            label: "Time Tracker",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "E-commerce",
            label: "E-commerce",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "Fack News Detection",
            label: "Fack News Detection",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "Travel Together",
            label: "Travel Together",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "Time Tracker2",
            label: "Time Tracker2",
            avatar: "https://picsum.photos/200/300",
        },
    ]
    const users = [
        {
            value: "Juyed Ahmed",
            label: "Juyed Ahmed",
            avatar: "https://avatar.iran.liara.run/public/18",
        },
        {
            value: "Cameron Williamson",
            label: "Cameron Williamson",
            avatar: "https://avatar.iran.liara.run/public/19",
        },
        {
            value: "Jenny Wilson",
            label: "Jenny Wilson",
            avatar: "https://avatar.iran.liara.run/public/20",
        },
        {
            value: "Esther Howard",
            label: "Esther Howard",
            avatar: "https://avatar.iran.liara.run/public/21",
        },
        {
            value: "Walid Ahmed",
            label: "Walid Ahmed",
            avatar: "https://avatar.iran.liara.run/public/22",
        },
    ]
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
                <SelectProjectDropDown projects={projects}></SelectProjectDropDown>
                <SelectUserDropDown users={users}></SelectUserDropDown>
            </div>
            <ManualRequestsTable></ManualRequestsTable>
            {/* <ManualRequestsSkeleton></ManualRequestsSkeleton> */}
        </div>
    );
};

export default ManualRequests;