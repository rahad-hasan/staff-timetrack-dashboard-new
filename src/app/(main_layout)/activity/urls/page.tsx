"use client"

import { Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import UrlsTable from "@/components/Activity/Urls/UrlsTable";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";


const Urls = () => {
    console.log('urls');
    // Filter
    const [project, setProject] = useState<string | null>(null);
    const [task, setTask] = useState<string | null>(null);
    const [taskSearch, setTaskSearch] = useState("");
    const [projectSearch, setProjectSearch] = useState("");
    const projects = ["Orbit Project", "App Redesign", "Marketing Campaign", "New Website"];
    const tasks = ["Website Design", "Working on App Design", "New Landing Page", "Work on helsenist Project"];
    // Filtered options
    const filteredProjects = projects.filter(p => p.toLowerCase().includes(projectSearch.toLowerCase()));
    const filteredTasks = tasks.filter(t => t.toLowerCase().includes(taskSearch.toLowerCase()));

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

    // date picker
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    return (
        <div>
            <div className="flex justify-between gap-3 mb-5">
                <div>
                    <h1 className=" text-2xl md:text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">URLs Activity</h1>
                    <p className="text-sm text-subTextColor mt-2 dark:text-darkTextPrimary">
                        All the URLs activity during the working hour by team member is here
                    </p>
                </div>

                <div className=" flex items-center gap-1.5 sm:gap-3">
                    {/* <button
                        className={`px-3 sm:px-4 py-2 sm:py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 hover:text-textGray dark:bg-darkPrimaryBg dark:text-darkTextSecondary border border-borderColor"
                                `}
                    >
                        <Download size={20} /> <span className=" hidden sm:block">Export</span>
                    </button> */}
                    <button
                        className={`px-3 py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 dark:border-darkBorder hover:text-textGray border border-borderColor "
                                `}
                    >
                        <Settings className=" text-primary" size={20} />
                    </button>
                </div>
            </div>


            <div className=" mb-5 flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between">
                <div className=" flex gap-3">
                    <SpecificDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></SpecificDatePicker>
                    {/* Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button className=" hidden lg:flex dark:text-darkTextPrimary" variant={'filter'}>
                                <SlidersHorizontal className="dark:text-darkTextPrimary" /> Filters
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="start" className="w-80">
                            {
                                <div className="flex flex-col gap-4 mt-4">
                                    {/* Project Select with Search */}
                                    <p className=" -mb-2">Member</p>
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
                                                <SelectItem className="px-3 flex items-center gap-2" key={t.name} value={t.name}>
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarImage src={t.avatar} alt={t.name} />
                                                        <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="ml-2">{t.name}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className=" -mb-2">Project</p>
                                    <Select onValueChange={setProject}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Project" />
                                        </SelectTrigger>
                                        <SelectContent className="flex items-center">

                                            <Input
                                                type="text"
                                                placeholder="Search project..."
                                                className="flex-1 border-none focus:ring-0 focus:outline-none"
                                                value={projectSearch}
                                                onChange={(e) => setProjectSearch(e.target.value)}
                                            />

                                            {filteredProjects.map(p => (
                                                <SelectItem className="px-3" key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Task Select with Search */}
                                    <p className=" -mb-2">Task</p>
                                    <Select onValueChange={setTask}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Task" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <Input
                                                type="text"
                                                placeholder="Search task..."
                                                className="flex-1 border-none focus:ring-0 focus:outline-none"
                                                value={taskSearch}
                                                onChange={(e) => setTaskSearch(e.target.value)}
                                            />
                                            {filteredTasks.map(t => (
                                                <SelectItem className="px-3" key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            }
                        </PopoverContent>
                    </Popover>
                </div>
                <div className=" flex items-center gap-3">

                    <div className=" w-full sm:w-[250px]">
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
                                    <SelectItem className="px-3 flex items-center gap-2" key={t.name} value={t.name}>
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
                </div>
            </div>
            <UrlsTable></UrlsTable>
        </div>
    );
};

export default Urls;