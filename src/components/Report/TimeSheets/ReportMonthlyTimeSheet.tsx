import MonthPicker from "@/components/Common/MonthPicker";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ReportMonthlyTimeSheet = () => {
    type DayMeta = { name: string };
    const days: DayMeta[] = [
        { name: 'MON' },
        { name: 'TUE' },
        { name: 'WED' },
        { name: 'THU' },
        { name: 'FRI' },
        { name: 'SAT' },
        { name: 'SUN' },
    ];
    interface CalendarDay {
        date: number;
        time: string | null;
    }
    const calendarData: CalendarDay[] = [
        // Week 1
        { date: 29, time: null }, { date: 30, time: null }, { date: 1, time: '-' }, { date: 2, time: '8h 0m' },
        { date: 3, time: '8h 0m' }, { date: 4, time: '8h 0m' }, { date: 5, time: '8h 0m' },
        // Week 2
        { date: 6, time: '8h 0m' }, { date: 7, time: '8h 0m' }, { date: 8, time: '8h 0m' }, { date: 9, time: null },
        { date: 10, time: null }, { date: 11, time: null }, { date: 12, time: null },
        // Week 3
        { date: 13, time: null }, { date: 14, time: null }, { date: 15, time: null }, { date: 16, time: null },
        { date: 17, time: null }, { date: 18, time: null }, { date: 19, time: null },
        // Week 4
        { date: 20, time: null }, { date: 21, time: null }, { date: 22, time: null }, { date: 23, time: null },
        { date: 24, time: null }, { date: 25, time: null }, { date: 26, time: null },
        // Week 5
        { date: 27, time: null }, { date: 28, time: null }, { date: 29, time: null }, { date: 30, time: null },
        { date: 31, time: null }, { date: 1, time: null }, { date: 2, time: null },
    ];

    const ROWS_PER_WEEK = 7;


    const chunkArray = (array: CalendarDay[], chunkSize: number) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    };

    const weeks = chunkArray(calendarData, ROWS_PER_WEEK);
    console.log(weeks);
    // month picker
    const [selectedDate, setSelectedDate] = useState(new Date());

    // search user
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
        <div className="">
            <div className=" flex items-center justify-between">
                <MonthPicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></MonthPicker>
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
            <div className="overflow-x-auto rounded-2xl border border-borderColor mt-5">
                <table className="w-full border-collapse">
                    <thead className="bg-white">
                        <tr>
                            {days.map((d, i) => (
                                <th
                                    key={i}
                                    className={`
                                        px-4 py-4 text-xl font-bold
                                        border-b border-gray-200 ${i < days.length - 1 ? 'border-r border-gray-200' : ''}
                                    `}
                                >
                                    {d.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {weeks.map((week, weekIndex) => (
                            <tr key={weekIndex} className="h-20">
                                {week.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={`
                                            ${weekIndex < weeks.length - 1 ? 'border-b border-gray-200' : ''} 
                                            ${cellIndex < week.length - 1 ? 'border-r border-gray-200' : ''}
                                        `}
                                    >
                                        <div className=" flex flex-col items-center justify-center h-full">
                                            <div className="text-base font-normal">{cell.date}</div>
                                            {cell.time && (
                                                <div className={`text-xs font-medium mt-1 ${cell.time === '-' ? 'text-gray-400' : 'text-primary'}`}>
                                                    {cell.time}
                                                </div>
                                            )}
                                        </div>

                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default ReportMonthlyTimeSheet;