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
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import SearchBar from "@/components/Common/SearchBar";
import TaskTable from "@/components/ProjectManagement/Task/TaskTable";

const TaskPage = () => {
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-semibold text-headingTextColor">Tasks</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the tasks during the working hour by team member is here
                    </p>
                </div>

                <div className=" flex items-center gap-5">
                    <div className="flex gap-3">
                        <div className="flex mt-3 sm:mt-0 bg-[#f6f7f9] rounded-lg overflow-hidden">
                            {["List view", "Kanban"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => handleTabClick(tab as "List view" | "Kanban")}
                                    className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                                        ? "bg-white text-headingTextColor shadow-sm"
                                        : "text-gray-600 hover:text-gray-800"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button><Plus size={20} />Create Task</Button>
                </div>
            </div>
            <div className=" flex items-center justify-between">
                <div className=" flex items-center gap-4">
                    <Select onValueChange={setProject} value={project ?? undefined}>
                        <SelectTrigger size={'lg'} className="w-full">
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

                    <Select onValueChange={setUser} value={user ?? undefined}>
                        <SelectTrigger size={'lg'} className="w-full">
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
                </div>
                <SearchBar onSearch={handleSearch}></SearchBar>
            </div>
            {
                activeTab === "List view" &&
                <TaskTable></TaskTable>
            }
        </div>
    );
};

export default TaskPage;