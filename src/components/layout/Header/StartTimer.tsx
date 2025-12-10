"use client";

import { useState, useRef, useEffect } from "react";
import { PopoverContent } from "@/components/ui/popover";
import Image from "next/image";
import playIcon from '../../../assets/header/playIcon.svg';
import pauseIcon from '../../../assets/header/pauseIcon.svg';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import CrossIcon from "@/components/Icons/CrossIcon";
import JobIcon from "@/components/Icons/JobIcon";
import TaskListIcon from "@/components/Icons/TaskListIcon";
import { Label } from "@/components/ui/label";

const projects = ["Orbit Project", "App Redesign", "Marketing Campaign", "New Website"];
const tasks = ["Website Design", "Working on App Design", "New Landing Page", "Work on helsenist Project"];

const StartTimer = ({ onClose }: { onClose: () => void }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [time, setTime] = useState(0);
    const [project, setProject] = useState<string | null>(null);
    const [task, setTask] = useState<string | null>(null);
    const [taskSearch, setTaskSearch] = useState("");
    const [projectSearch, setProjectSearch] = useState("");
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const toggleTimer = () => setIsRunning(prev => !prev);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => setTime(prev => prev + 1), 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning]);

    const formatTime = (seconds: number) => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    // Filtered options
    const filteredProjects = projects.filter(p => p.toLowerCase().includes(projectSearch.toLowerCase()));
    const filteredTasks = tasks.filter(t => t.toLowerCase().includes(taskSearch.toLowerCase()));

    return (
        <PopoverContent side="bottom" align="start" onInteractOutside={(e) => e.preventDefault()} className="sm:w-[450px] border-borderColor dark:border-darkBorder dark:bg-darkSecondaryBg">
            <div className="  border-b border-borderColor dark:border-darkBorder py-3.5 px-5 flex justify-end ">
                <div onClick={onClose} className="cursor-pointer">
                    <CrossIcon size={16} />
                </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 md:gap-4 px-5 py-4">
                <div className=" flex items-center gap-1 md:gap-2">
                    <Image
                        onClick={toggleTimer}
                        src={isRunning ? pauseIcon : playIcon}
                        width={200}
                        height={200}
                        alt="timer control"
                        className="w-10 cursor-pointer"
                    />
                    <div>
                        <p className="font-medium text-base sm:text-base text-headingTextColor dark:text-darkTextPrimary">{project || "Select Project"}</p>
                        <p className="text-subTextColor text-sm dark:text-darkTextSecondary">{task || "Select Task"}</p>
                        {
                            task &&
                            <p className="text-subTextColor dark:text-darkTextSecondary text-sm">2 Hours limit</p>
                        }
                    </div>
                </div>

                <div>
                    <h2 className="text-base sm:text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">{formatTime(time)}</h2>
                    <p className="text-sm text-subTextColor dark:text-darkTextSecondary">Today: {formatTime(time)}</p>
                </div>
            </div>

            {
                !task &&
                <div className="flex flex-col gap-4 px-5 pb-5">
                    {/* Project Select with Search */}
                    <Label className=" -mb-1.5">Project</Label>
                    <Select onValueChange={setProject}>
                        <SelectTrigger className="w-full">
                            <div className=" flex gap-2 items-center text-headingTextColor dark:text-darkTextPrimary">
                                <div className="text-headingTextColor dark:text-darkTextPrimary">
                                    <JobIcon className="text-headingTextColor dark:text-darkTextPrimary" size={18} />
                                </div>
                                <SelectValue className=" text-start" placeholder="Select Project" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="flex items-center">
                            <Input
                                type="text"
                                placeholder="Search project..."
                                className="flex-1 border-none focus:ring-0 focus:outline-none dark:bg-darkSecondaryBg"
                                value={projectSearch}
                                onChange={(e) => setProjectSearch(e.target.value)}
                            />

                            {filteredProjects.map(p => (
                                <SelectItem className="px-3" key={p} value={p}>{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Task Select with Search */}
                    <Label className=" -mb-1.5">Select Task</Label>
                    <Select onValueChange={setTask}>
                        <SelectTrigger className="w-full">
                            <div className=" flex gap-2 items-center text-headingTextColor dark:text-darkTextPrimary">
                                <TaskListIcon className="text-headingTextColor dark:text-darkTextPrimary" size={18} />
                                <SelectValue className=" text-start" placeholder="Select Task" />
                            </div>
                        </SelectTrigger>

                        <SelectContent>
                            <Input
                                type="text"
                                placeholder="Search task..."
                                className="flex-1 border-none focus:ring-0 focus:outline-none dark:bg-darkSecondaryBg"
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
    );
};

export default StartTimer;
