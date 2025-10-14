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

const projects = ["Orbit Project", "App Redesign", "Marketing Campaign", "New Website"];
const tasks = ["Website Design", "Working on App Design", "New Landing Page", "Work on helsenist Project"];

const StartTimer = () => {
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
        <PopoverContent side="bottom" align="start" className="md:w-[450px] p-4">
            <div className="flex justify-between items-center gap-2 md:gap-4">
                <div className=" flex items-center gap-1 md:gap-4">
                    <Image
                        onClick={toggleTimer}
                        src={isRunning ? pauseIcon : playIcon}
                        width={200}
                        height={200}
                        alt="timer control"
                        className="w-10 cursor-pointer"
                    />
                    <div>
                        <p className="font-semibold">{project || "Select Project"}</p>
                        <p className="text-gray-500 text-sm">{task || "Select Task"}</p>
                        {
                            task &&
                            <p className="text-gray-500 text-sm">2 Hours limit</p>
                        }
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold">{formatTime(time)}</h2>
                    <p className="text-sm text-gray-500">Today: {formatTime(time)}</p>
                </div>

            </div>

            {
                !task &&
                <div className="flex flex-col gap-4 mt-4">
                    {/* Project Select with Search */}
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
    );
};

export default StartTimer;
