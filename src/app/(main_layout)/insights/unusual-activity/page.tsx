"use client"
import { Bell, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import { useState } from "react";
import UnusualActivityTable from "@/components/Insights/UnusualActivity/UnusualActivityTable";

const UnusualActivity = () => {
    console.log('Performance');
    const [activeTab, setActiveTab] = useState<"Highly Unusual" | "Unusual" | "Slightly Unusual">("Highly Unusual");
    console.log("Dashboard Rendered", activeTab);

    const handleTabClick = (tab: "Highly Unusual" | "Unusual" | "Slightly Unusual") => {
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

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className=" text-2xl md:text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">Unusual Activity</h1>
                    <p className="text-sm text-subTextColor mt-2 dark:text-darkTextPrimary">
                        All the Unusual activity during the working hour by team member is here
                    </p>
                </div>

                <div className=" flex items-center gap-1.5 sm:gap-3">
                    <button
                        className={`px-3 sm:px-4 py-2 sm:py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 hover:text-textGray dark:bg-darkPrimaryBg dark:text-darkTextSecondary border border-borderColor"
                                `}
                    >
                        <Bell size={20} /> <span className=" hidden sm:block">Smart Notification </span>
                    </button>
                    <button
                        className={`px-3 py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 dark:border-darkBorder hover:text-textGray border border-borderColor "
                                `}
                    >
                        <Settings className=" text-primary" size={20} />
                    </button>
                </div>
            </div>
            <div className=" mb-5 flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between">
                <div className=" flex flex-col md:flex-row gap-4 md:gap-3">
                    <SpecificDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></SpecificDatePicker>
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
            <div className="flex mt-3 sm:mt-0 bg-[#f6f7f9] dark:bg-darkPrimaryBg rounded-lg w-[341px] sm:w-[359px]">
                {["Highly Unusual", "Unusual", "Slightly Unusual"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabClick(tab as "Highly Unusual" | "Unusual" | "Slightly Unusual")}
                        className={`px-4 py-2 text-[13px] sm:text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                            ? "bg-white dark:bg-primary text-headingTextColor shadow-sm"
                            : "text-gray-600 dark:text-darkTextSecondary hover:text-gray-800"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <UnusualActivityTable></UnusualActivityTable>
        </div>
    );
};

export default UnusualActivity;