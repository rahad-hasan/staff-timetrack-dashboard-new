"use client"
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import SearchBar from "@/components/Common/SearchBar";
import TaskTable from "@/components/ProjectManagement/Task/TaskTable";
import KanbanDndList from "@/components/ProjectManagement/Task/KanbanDndList";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog";
import CreateTaskModal from "@/components/ProjectManagement/Task/CreateTaskModal";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
// import KanbanDndListSkeleton from "@/skeleton/projectManagement/task/KanbanDndListSkeleton";
// import TaskTableSkeleton from "@/skeleton/projectManagement/task/TaskTableSkeleton";

const TaskPage = () => {
    console.log("Task");
    const [activeTab, setActiveTab] = useState<"List view" | "Kanban">("List view");

    const handleTabClick = (tab: "List view" | "Kanban") => {
        setActiveTab(tab);
    };

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

    const handleSearch = (values: string) => {
        console.log(values);
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                <HeadingComponent heading="Tasks" subHeading="All the tasks during the working hour by team member is here"></HeadingComponent>

                <div className=" flex items-center gap-3 sm:gap-5">
                    <div className="flex gap-3">
                        <div className="flex bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg overflow-hidden">
                            {["List view", "Kanban"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => handleTabClick(tab as "List view" | "Kanban")}
                                    className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                                        ? "bg-bgPrimary text-headingTextColor shadow-sm dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                                        : "text-gray-600 hover:text-gray-800 dark:text-darkTextPrimary"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Dialog>
                        <form>
                            <DialogTrigger asChild>
                                <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Create Task</span></Button>
                            </DialogTrigger>
                            <CreateTaskModal></CreateTaskModal>
                        </form>
                    </Dialog>

                </div>
            </div>
            <div className=" flex flex-col gap-4 md:gap-0 md:flex-row justify-between">
                <div className=" flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                    <SelectProjectDropDown projects={projects}></SelectProjectDropDown>
                    <div className=" flex items-center gap-3 w-full">
                        <div className=" w-full">
                            <SelectUserDropDown users={users}></SelectUserDropDown>
                        </div>
                        <div className=" block sm:hidden">
                            <SearchBar onSearch={handleSearch}></SearchBar>
                        </div>
                    </div>
                </div>
                <div className=" hidden sm:block">
                    <SearchBar onSearch={handleSearch}></SearchBar>
                </div>
            </div>
            {
                activeTab === "List view" &&
                <TaskTable></TaskTable>
            }
            {/* {
                activeTab === "List view" &&
                <TaskTableSkeleton></TaskTableSkeleton>
            } */}
            {
                activeTab === "Kanban" &&
                <KanbanDndList></KanbanDndList>
            }
            {/* {
                activeTab === "Kanban" &&
                <KanbanDndListSkeleton></KanbanDndListSkeleton>
            } */}
        </div>
    );
};

export default TaskPage;