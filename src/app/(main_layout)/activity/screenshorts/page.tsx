/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Every10Mins from "@/components/Activity/ScreenShorts/Every10Mins";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, ChevronLeft, ChevronRight, NotepadText, SlidersHorizontal } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";

const ScreenShorts = () => {
    const [activeTab, setActiveTab] = useState<"Every 10 min" | "All Screenshots">("Every 10 min");

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
                        {["Every 10 min", "All Screenshots", "Monthly"].map((tab) => (
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
                    <Button variant={'outline2'}>
                        <SlidersHorizontal className="" /> Filters
                    </Button>
                </div>
                <div className=" flex items-center gap-3">
                    <Button variant={'outline2'}>
                        <NotepadText className="" /> All Notes
                    </Button>
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

            {
                activeTab === "Every 10 min" &&
                <Every10Mins></Every10Mins>
            }

        </div>
    );
};

export default ScreenShorts;
