"use client"
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import SearchBar from "@/components/Common/SearchBar";
import TaskTable from "@/components/ProjectManagement/Task/TaskTable";
import KanbanDndList from "@/components/ProjectManagement/Task/KanbanDndList";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog";
import CreateTaskModal from "@/components/ProjectManagement/Task/CreateTaskModal";

const TaskPage = () => {
    console.log("Task");
    const [activeTab, setActiveTab] = useState<"List view" | "Kanban">("List view");

    const handleTabClick = (tab: "List view" | "Kanban") => {
        setActiveTab(tab);
    };

    // user select
    const users = [
        { name: "Juyed Ahmed", avatar: "https://avatar.iran.liara.run/public/18" },
        { name: "Cameron Williamson", avatar: "https://avatar.iran.liara.run/public/19" },
        { name: "Jenny Wilson", avatar: "https://avatar.iran.liara.run/public/20" },
        { name: "Esther Howard", avatar: "https://avatar.iran.liara.run/public/21" }
    ];
    const [userSearch, setUserSearch] = useState("");
    const [user, setUser] = useState<string>("Juyed Ahmed");

    const filteredUsers = users.filter(t => t.name.toLowerCase().includes(userSearch.toLowerCase()));
    const selectedUser = users.find((u) => u.name === user);

    // project select
    const projects = [
        { name: "Time Tracker", avatar: "https://picsum.photos/200/300" },
        { name: "E-commerce", avatar: "https://picsum.photos/200/300" },
        { name: "Fack News Detection", avatar: "https://picsum.photos/200/300" },
        { name: "Travel Together", avatar: "https://picsum.photos/200/300" }
    ];
    const [projectSearch, setProjectSearch] = useState("");
    const [project, setProject] = useState<string>("Time Tracker");

    const filteredProjects = projects.filter(t => t.name.toLowerCase().includes(projectSearch.toLowerCase()));
    const selectedProject = projects.find((u) => u.name === project);
    // search
    const handleSearch = (values: string) => {
        console.log(values);
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">Tasks</h1>
                    <p className="text-sm text-subTextColor mt-2 dark:text-darkTextPrimary">
                        All the tasks during the working hour by team member is here
                    </p>
                </div>

                <div className=" flex items-center gap-3 sm:gap-5">
                    <div className="flex gap-3">
                        <div className="flex bg-[#f6f7f9] dark:bg-darkPrimaryBg rounded-lg overflow-hidden">
                            {["List view", "Kanban"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => handleTabClick(tab as "List view" | "Kanban")}
                                    className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                                        ? "bg-white text-headingTextColor shadow-sm dark:bg-primary"
                                        : "text-gray-600 hover:text-gray-800 dark:text-darkTextSecondary"
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
                    <Select onValueChange={setProject} value={project ?? undefined}>
                        <SelectTrigger size={'lg'} className="w-full py-1.5">
                            {selectedProject ? (
                                <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={selectedProject.avatar} alt={selectedProject.name} />
                                        <AvatarFallback>{selectedProject.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{selectedProject.name}</span>
                                </div>
                            ) : (
                                <SelectValue placeholder="Select user" />
                            )}
                        </SelectTrigger>

                        <SelectContent>
                            <Input
                                type="text"
                                placeholder="Search user..."
                                className="flex-1 border-none focus:ring-0 focus:outline-none"
                                value={userSearch}
                                onChange={(e) => setProjectSearch(e.target.value)}
                            />
                            {filteredProjects.map(t => (
                                <SelectItem className="px-3 flex items-center gap-2 cursor-pointer" key={t.name} value={t.name}>
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={t.avatar} alt={t.name} />
                                        <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="ml-2">{t.name}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className=" flex items-center gap-3 w-full">
                        <Select onValueChange={setUser} value={user ?? undefined}>
                            <SelectTrigger size={'lg'} className="w-full py-1.5">
                                {selectedUser ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6">
                                            <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                                            <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span>{selectedUser.name}</span>
                                    </div>
                                ) : (
                                    <SelectValue placeholder="Select user" />
                                )}
                            </SelectTrigger>

                            <SelectContent>
                                <Input
                                    type="text"
                                    placeholder="Search user..."
                                    className="flex-1 border-none focus:ring-0 focus:outline-none"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                                {filteredUsers.map(t => (
                                    <SelectItem className="px-3 flex items-center gap-2 cursor-pointer" key={t.name} value={t.name}>
                                        <Avatar className="w-6 h-6">
                                            <AvatarImage src={t.avatar} alt={t.name} />
                                            <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="ml-2">{t.name}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
            {
                activeTab === "Kanban" &&
                <KanbanDndList></KanbanDndList>
            }
        </div>
    );
};

export default TaskPage;