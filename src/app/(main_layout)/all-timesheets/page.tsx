/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import DailyTable from "@/components/AllTimesheets/DailyTable";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Plus, SlidersHorizontal } from "lucide-react";
import { useCallback, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const AllTimeSheets = () => {
    const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
    const users = [
        { name: "Juyed Ahmed", avatar: "https://avatar.iran.liara.run/public/18" },
        { name: "Cameron Williamson", avatar: "https://avatar.iran.liara.run/public/19" },
        { name: "Jenny Wilson", avatar: "https://avatar.iran.liara.run/public/20" },
        { name: "Esther Howard", avatar: "https://avatar.iran.liara.run/public/21" }
    ];

    const [userSearch, setUserSearch] = useState("");
    const [user, setUser] = useState<string>("Juyed Ahmed");

    const handleTabClick = (tab: "Daily" | "Weekly" | "Monthly") => {
        setActiveTab(tab);
    };

    const filteredUsers = users.filter(t => t.name.toLowerCase().includes(userSearch.toLowerCase()));

    const selectedUser = users.find((u) => u.name === user);

    const activePeriods = [
        { start: 5, end: 7 }, // Active from 5 AM to 7 AM
        { start: 13, end: 16 }, // Active from 1 PM to 4 PM
        { start: 18, end: 20 }, // Active from 6 PM to 8 PM
    ];

    // date picker
    const [selectedDate, setSelectedDate] = useState(new Date());
    const formatDate = (date: any) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short', // Mon
            month: 'short',   // Oct
            day: 'numeric',   // 9
            year: 'numeric',  // 2025
        });
    };

    const handleNavigate = useCallback((days:any) => {
        setSelectedDate(prevDate => {
            const newDate = new Date(prevDate);
            // setDate(getDate() + days) moves the date by the specified number of days
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        });
    }, []);

    const dateDisplay = formatDate(selectedDate);

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-semibold text-headingTextColor">All timesheets</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the timesheet by team member who completed is displayed here
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="flex mt-3 sm:mt-0 bg-[#f6f7f9] rounded-lg overflow-hidden">
                        {["Daily", "Weekly", "Monthly"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Daily" | "Weekly" | "Monthly")}
                                className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                                    ? "bg-white text-headingTextColor shadow-sm"
                                    : "text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <Button><Plus size={20} />Add Time</Button>
                </div>
            </div>
            <div className=" mb-5 flex justify-between">
                <div className=" flex gap-3">
                    <div className="flex">
                        <ChevronLeft onClick={() => handleNavigate(-1)} size={45} className="border p-2.5 border-borderColor rounded-lg cursor-pointer" />
                        <div className=" flex items-center gap-2 border rounded-md px-4 mx-3">
                            <Calendar className=" text-primary" />
                            <span>{dateDisplay}</span>
                        </div>
                        <ChevronRight onClick={() => handleNavigate(1)} size={45} className="border p-2.5 border-borderColor rounded-lg cursor-pointer" />
                    </div>
                    <Button variant={'outline2'}>
                        <SlidersHorizontal className="" /> Filters
                    </Button>
                </div>
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

            <div className=" mb-5">
                <div className=" flex gap-2 mb-2">
                    <h1 className=" font-bold">Today:</h1>
                    <p className="">6:00:00</p>
                </div>
                <div className="relative h-5 bg-[#f6f7f9] rounded-4xl border border-borderColor">
                    {activePeriods.map((period, index) => {
                        const startPercent = (period.start / 24) * 100;
                        const endPercent = (period.end / 24) * 100;
                        const width = endPercent - startPercent;

                        return (
                            <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                    <div
                                        key={index}
                                        className="absolute h-5 bg-green-400 rounded-4xl"
                                        style={{
                                            left: `${startPercent}%`,
                                            width: `${width}%`,
                                        }}
                                    ></div>
                                </TooltipTrigger>
                                <TooltipContent className=" bg-[#868686] p-3">
                                    <div>
                                        <h2 className=" text-[15px] mb-2">Project: Orbit Technology’s Project</h2>
                                        <h2 className=" text-[15px] mb-2">Task: Front End Development</h2>
                                        <h2 className=" text-[15px]">Duration: 2:00:00</h2>
                                    </div>
                                </TooltipContent>
                            </Tooltip>

                        );
                    })}
                </div>
                <div className=" flex justify-between mt-[2px]">
                    {Array.from({ length: 24 }, (_, i) => (
                        <span className=" text-sm text-gray-400" key={i}>{i + 1}h</span>
                    ))}
                </div>
            </div>
            <div className="border-2 border-borderColor p-3 rounded-[12px]">
                <DailyTable></DailyTable>
            </div>
        </div>
    );
};

export default AllTimeSheets;
