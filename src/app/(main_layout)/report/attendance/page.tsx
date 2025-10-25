"use client"
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
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import { Checkbox } from "@/components/ui/checkbox";
import AttendanceTable from "@/components/Report/Attendance/AttendanceTable";
// import AttendanceTableSkeleton from "@/skeleton/report/Attendance/AttendanceTableSkeleton";

const AttendancePage = () => {
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

    // date picker
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                    <h1 className=" text-2xl md:text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">Attendance</h1>
                    <p className="text-sm text-subTextColor mt-2 dark:text-darkTextPrimary">
                        All the Attendance during the working hour by team member is here
                    </p>
                </div>

            </div>
            <div className=" flex items-center justify-between w-full">
                <div className="flex flex-col md:flex-row gap-4 md:gap-3 w-full">
                    <SpecificDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></SpecificDatePicker>
                    <div className=" flex items-center justify-between">
                        <Select onValueChange={setProject} value={project ?? undefined}>
                            <SelectTrigger size={'lg'} className=" w-[170px] sm:w-[250px]">
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
                                    value={projectSearch}
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
                        <div className=" flex md:hidden items-center gap-2">
                            <Checkbox className=" cursor-pointer border-primary" />
                            <p>No check in data</p>
                        </div>
                    </div>
                </div>

                <div className=" w-[200px] hidden md:flex items-center justify-end gap-2">
                    <Checkbox className=" cursor-pointer border-primary" />
                    <p>No check in data</p>
                </div>
            </div>
            <AttendanceTable></AttendanceTable>
            {/* <AttendanceTableSkeleton></AttendanceTableSkeleton> */}
        </div>
    );
};

export default AttendancePage;