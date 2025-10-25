"use client"
import ManualRequestsTable from "@/components/TimeSheets/ManualRequests/ManualRequestsTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AddManualTimeModal from "@/components/TimeSheets/ManualRequests/AddManualTimeModal";

const ManualRequests = () => {
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
    return (
        <div>
            <div className="flex items-center justify-between gap-3 md:gap-0 mb-5">
                <div>
                    <h1 className=" text-2xl md:text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">Manual Requests</h1>
                    <p className="text-sm text-subTextColor mt-2 dark:text-darkTextPrimary">
                        All the timesheet by team member who completed is displayed here
                    </p>
                </div>

                <div className="">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add Time</span></Button>
                        </DialogTrigger>
                        <AddManualTimeModal></AddManualTimeModal>
                    </Dialog>

                </div>
            </div>
            <div className=" flex justify-between items-center gap-4 md:gap-3 mb-5">
                <div className="">
                    <Button className=" w-10 sm:w-auto h-10 sm:h-auto dark:text-darkTextPrimary" variant={'outline2'}>
                        <SlidersHorizontal className="" /> <span className=" hidden sm:block dark:text-darkTextPrimary">Filters</span>
                    </Button>
                </div>
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
            <ManualRequestsTable></ManualRequestsTable>
        </div>
    );
};

export default ManualRequests;