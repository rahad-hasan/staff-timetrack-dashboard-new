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
import TotalHoursPerDayChart from "@/components/Report/TimeAndActivities/TotalHoursPerDayChart";
import TimeAndActivitiesTable from "@/components/Report/TimeAndActivities/TimeAndActivitiesTable";

const TimeAndActivitiesPage = () => {
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
                    <h1 className=" text-2xl md:text-3xl font-semibold text-headingTextColor">Time & activities</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the Time & activities during the working hour by team member is here
                    </p>
                </div>

            </div>
            <div className=" flex items-center justify-between">
                <div className=" w-full flex flex-col sm:flex-row gap-4 sm:gap-4">
                    <SpecificDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></SpecificDatePicker>
                    <Select onValueChange={setProject} value={project ?? undefined}>
                        <SelectTrigger size={'lg'} className=" w-full sm:w-[300px]">
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
                </div>
            </div>
            <div className="mt-4 flex items-stretch gap-6 max-w-[600px]">
                <div className="border border-borderColor rounded-xl w-full flex flex-col justify-between">
                    <div className="flex items-center justify-center py-6 bg-[#eff7fe] border-b border-borderColor rounded-t-xl flex-1">
                        <h2 className="text-3xl font-semibold text-center">60:33:52</h2>
                    </div>
                    <div className="text-center py-2 font-medium text-gray-600">
                        Worked Time
                    </div>
                </div>

                <div className="border border-borderColor rounded-xl w-full flex flex-col justify-between">
                    <div className="flex flex-col items-center justify-center py-6 bg-[#fff5db] border-b border-borderColor rounded-t-xl flex-1">
                        <div className="w-25 h-25 rounded-full border-[6px] border-[#f5b400] flex items-center justify-center bg-[#fff5db]">
                            <span className="text-2xl font-semibold text-gray-800">50.12%</span>
                        </div>
                    </div>
                    <div className="text-center py-2 font-medium text-gray-600">
                        Avg. Activity
                    </div>
                </div>
            </div>

            <TotalHoursPerDayChart></TotalHoursPerDayChart>
            <TimeAndActivitiesTable></TimeAndActivitiesTable>
        </div>
    );
};

export default TimeAndActivitiesPage;