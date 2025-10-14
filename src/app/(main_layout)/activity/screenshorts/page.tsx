/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import AllScreenShorts from "@/components/Activity/ScreenShorts/AllScreenShorts";
import Every10Mins from "@/components/Activity/ScreenShorts/Every10Mins";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BriefcaseBusiness, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, NotepadText, SlidersHorizontal, SquareActivity, TrendingDown, TrendingUp, UsersRound } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AllNotesModal from "@/components/Activity/ScreenShorts/AllNotes";

const ScreenShorts = () => {
    const [activeTab, setActiveTab] = useState<"Every 10 min" | "All Screenshots">("Every 10 min");
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

    const handleTabClick = (tab: "Every 10 min" | "All Screenshots") => {
        setActiveTab(tab);
    };

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
    const formatDate = (date: any) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short', // Mon
            month: 'short',   // Oct
            day: 'numeric',   // 9
            year: 'numeric',  // 2025
        });
    };

    const handleNavigate = useCallback((days: any) => {
        setSelectedDate(prevDate => {
            const newDate = new Date(prevDate);
            // setDate(getDate() + days) moves the date by the specified number of days
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        });
    }, []);

    const dateDisplay = formatDate(selectedDate);
    // date popup open
    const [open, setOpen] = useState(false)

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-semibold text-headingTextColor">Screenshot</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the screenshot during the working hour by team member is here
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="flex mt-3 sm:mt-0 bg-[#f6f7f9] rounded-lg overflow-hidden">
                        {["Every 10 min", "All Screenshots"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Every 10 min" | "All Screenshots")}
                                className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                                    ? "bg-white text-headingTextColor shadow-sm"
                                    : "text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    {/* <Button><Plus size={20} />Add Time</Button> */}
                </div>
            </div>
            <div className=" mb-5 flex justify-between">

                <div className=" flex gap-3">
                    <div className="flex">
                        <ChevronLeft onClick={() => handleNavigate(-1)} size={45} className="border p-2.5 border-borderColor rounded-lg cursor-pointer" />

                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <div className=" flex items-center gap-2 border rounded-md px-4 mx-3 cursor-pointer">
                                    <CalendarDays className=" text-primary" />
                                    <span>{dateDisplay}</span>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    captionLayout="dropdown"
                                    onSelect={(selectedDate) => {
                                        if (selectedDate) setSelectedDate(selectedDate)
                                        setOpen(false)
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                        <ChevronRight onClick={() => handleNavigate(1)} size={45} className="border p-2.5 border-borderColor rounded-lg cursor-pointer" />
                    </div>
                    {/* Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={'outline2'}>
                                <SlidersHorizontal className="" /> Filters
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

                    <Dialog>
                        <form>
                            <DialogTrigger asChild>
                                <Button variant={'outline2'}>
                                    <NotepadText className="" /> All Notes
                                </Button>
                            </DialogTrigger>
                            <AllNotesModal></AllNotesModal>
                        </form>
                    </Dialog>

                    <div className=" w-[250px]">
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
            <div className=" mb-4 flex gap-5">
                <div className=" border-2 border-borderColor rounded-2xl w-full">
                    <div className=" flex items-center gap-2 px-3 py-5">
                        <SquareActivity size={40} className=" border-2 border-borderColor rounded-lg p-1.5" />
                        <div>
                            <h2 className=" text-xl font-semibold">48%</h2>
                            <h3 className=" text-textGray">AVG ACTIVITY</h3>
                        </div>
                    </div>
                    <div className=" bg-[#f6f7f9] rounded-b-2xl px-3 py-3 flex items-center gap-2">
                        <TrendingDown size={20} className=" text-red-500" />
                        <p className=" text-primary">+1.5%</p>
                        <p>last Monday</p>
                    </div>
                </div>
                <div className=" border-2 border-borderColor rounded-2xl w-full">
                    <div className=" flex items-center gap-2 px-3 py-5">
                        <BriefcaseBusiness size={40} className=" border-2 border-borderColor rounded-lg p-1.5" />
                        <div>
                            <h2 className=" text-xl font-semibold">48%</h2>
                            <h3 className=" text-textGray">WORKED TIME</h3>
                        </div>
                    </div>
                    <div className=" bg-[#f6f7f9] rounded-b-2xl px-3 py-3 flex items-center gap-2">
                        <TrendingUp size={20} className=" text-green-500" />
                        <p className=" text-primary">+1.5%</p>
                        <p>last Monday</p>
                    </div>
                </div>
                <div className=" border-2 border-borderColor rounded-2xl w-full">
                    <div className=" flex items-center gap-2 px-3 py-5">
                        <ClipboardList size={40} className=" border-2 border-borderColor rounded-lg p-1.5" />
                        <div>
                            <h2 className=" text-xl font-semibold">48%</h2>
                            <h3 className=" text-textGray">FOCUS TIME</h3>
                        </div>
                    </div>
                    <div className=" bg-[#f6f7f9] rounded-b-2xl px-3 py-3 flex items-center gap-2">
                        <TrendingDown size={20} className=" text-red-500" />
                        <p className=" text-primary">+1.5%</p>
                        <p>last Monday</p>
                    </div>
                </div>
                <div className=" border-2 border-borderColor rounded-2xl w-full">
                    <div className=" flex items-center gap-2 px-3 py-5">
                        <UsersRound size={40} className=" border-2 border-borderColor rounded-lg p-1.5" />
                        <div>
                            <h2 className=" text-xl font-semibold">48%</h2>
                            <h3 className=" text-textGray">CORE WORK</h3>
                        </div>
                    </div>
                    <div className=" bg-[#f6f7f9] rounded-b-2xl px-3 py-3 flex items-center gap-2">
                        <TrendingUp size={20} className=" text-green-500" />
                        <p className=" text-primary">+1.5%</p>
                        <p>last Monday</p>
                    </div>
                </div>
            </div>

            {
                activeTab === "Every 10 min" &&
                <Every10Mins></Every10Mins>
            }

            {
                activeTab === "All Screenshots" &&
                <AllScreenShorts></AllScreenShorts>
            }

        </div>
    );
};

export default ScreenShorts;