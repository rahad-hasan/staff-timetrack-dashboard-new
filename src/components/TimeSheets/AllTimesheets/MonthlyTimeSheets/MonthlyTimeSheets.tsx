import MonthlyTimeSheetsCalendar from "./MonthlyTimeSheetsCalendar";
import { Button } from "../../../ui/button";
import { Calendar, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useCallback, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MonthlyTimeSheets = () => {
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

    // month picker
    const [selectedDate, setSelectedDate] = useState(new Date());

    const formatMonth = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',  // 2025
            month: 'long',    // October
        });
    };

    const handleNavigate = useCallback((months: number) => {
        setSelectedDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + months);
            return newDate;
        });
    }, []);

    const monthDisplay = formatMonth(selectedDate);

    console.log("Selected Month:", monthDisplay);

    return (
        <div>
            <div className="mb-5 flex justify-between">
                <div className="flex gap-3">
                    <div className="flex">
                        <ChevronLeft
                            onClick={() => handleNavigate(-1)}
                            size={45}
                            className="border p-2.5 border-borderColor rounded-lg cursor-pointer"
                        />
                        <div className="flex items-center gap-2 border rounded-md px-4 mx-3">
                            <Calendar className="text-primary" />
                            <span>{monthDisplay}</span>
                        </div>
                        <ChevronRight
                            onClick={() => handleNavigate(1)}
                            size={45}
                            className="border p-2.5 border-borderColor rounded-lg cursor-pointer"
                        />
                    </div>
                    <Button variant={'outline2'}>
                        <SlidersHorizontal className="" /> Filters
                    </Button>
                </div>

                <div className="w-[250px]">
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

            <MonthlyTimeSheetsCalendar></MonthlyTimeSheetsCalendar>
        </div>
    );
};

export default MonthlyTimeSheets;