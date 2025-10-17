import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const ReportDailyTimeSheet = () => {
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
    const [selectedDate, setSelectedDate] = useState(new Date());

    // table

    const timeLine = [
        { time: '12:00 AM', project: 'Orbit Technology', startTime: '12:00 AM', endTime: '12:55 AM' },
        { time: '1:00 AM', project: 'Orbit Technology', startTime: '1:00 AM', endTime: '1:55 AM' },
        { time: '2:00 AM', project: 'Orbit Technology', startTime: '2:00 AM', endTime: '2:55 AM' },
        { time: '3:00 AM', project: null, startTime: '3:00 AM', endTime: '3:55 AM' },
        { time: '4:00 AM', project: null, startTime: '4:00 AM', endTime: '4:55 AM' },
        { time: '5:00 AM', project: null, startTime: '5:00 AM', endTime: '5:55 AM' },
        { time: '6:00 AM', project: null, startTime: '6:00 AM', endTime: '6:55 AM' },
        { time: '7:00 AM', project: null, startTime: '7:00 AM', endTime: '7:55 AM' },
        { time: '8:00 AM', project: 'Orbit Technology', startTime: '8:00 AM', endTime: '8:55 AM' },
        { time: '9:00 AM', project: 'Orbit Technology', startTime: '9:00 AM', endTime: '9:55 AM' },
        { time: '10:00 AM', project: 'Client Dashboard', startTime: '10:00 AM', endTime: '10:55 AM' },
        { time: '11:00 AM', project: null, startTime: '11:00 AM', endTime: '11:55 AM' },
        { time: '12:00 PM', project: null, startTime: '12:00 PM', endTime: '12:55 PM' },
        { time: '1:00 PM', project: null, startTime: '1:00 PM', endTime: '1:55 PM' },
        { time: '2:00 PM', project: null, startTime: '2:00 PM', endTime: '2:55 PM' },
        { time: '3:00 PM', project: null, startTime: '3:00 PM', endTime: '3:55 PM' },
        { time: '4:00 PM', project: null, startTime: '4:00 PM', endTime: '4:55 PM' },
        { time: '5:00 PM', project: null, startTime: '5:00 PM', endTime: '5:55 PM' },
        { time: '6:00 PM', project: null, startTime: '6:00 PM', endTime: '6:55 PM' },
        { time: '7:00 PM', project: null, startTime: '7:00 PM', endTime: '7:55 PM' },
        { time: '8:00 PM', project: null, startTime: '8:00 PM', endTime: '8:55 PM' },
        { time: '9:00 PM', project: 'Documentation', startTime: '9:00 PM', endTime: '9:55 PM' },
        { time: '10:00 PM', project: 'Code Review', startTime: '10:00 PM', endTime: '10:55 PM' },
        { time: '11:00 PM', project: null, startTime: '11:00 PM', endTime: '11:55 PM' },
    ];


    const TaskEntry = ({ project, startTime, endTime }: { project: string, startTime: string, endTime: string }) => {
        const isOrbit = project === 'Orbit Technology';
        const colorClass = isOrbit
            ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500'
            : 'bg-pink-100 text-pink-800 border-l-4 border-pink-500';

        if (!project) return null;

        return (
            <div
                className={`p-1.5 pl-2 my-[2px] max-w-1/2 rounded-sm text-xs font-semibold ${colorClass}`}
            >
                {project} <span className="font-normal">{startTime} - {endTime}</span>
            </div>
        );
    };

    return (
        <div>
            <div className=" flex items-center justify-between">
                <SpecificDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></SpecificDatePicker>
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

            <div className="mt-5">
                <div className="w-full overflow-hidden">

                    <table className="w-full border-collapse">

                        <thead>
                            <tr className=" text-xs text-textGray font-semibold uppercase tracking-wider">
                                <th className="w-1/12 p-3 text-center border-b border-gray-300">Time</th>
                                <th className="w-5/12 p-3 text-center border-b border-gray-300">Task</th>
                                <th className="w-1/12 p-3 text-center border-b border-gray-300">Time</th>
                                <th className="w-5/12 p-3 text-center border-b border-gray-300">Task</th>
                            </tr>
                        </thead>

                        <tbody>
                            {timeLine.slice(0, 12).map((amData, index) => {
                                const pmData = timeLine[index + 12];

                                return (
                                    <tr key={index} className="text-sm">

                                        <td className="p-3 text-left font-medium border-r border-gray-200 border-b text-gray-700">
                                            {amData.time}
                                        </td>

                                        <td className="p-2 border-r border-gray-300 border-b">
                                            {amData.project && (
                                                <TaskEntry
                                                    project={amData.project}
                                                    startTime={amData.startTime}
                                                    endTime={amData.endTime}
                                                />
                                            )}
                                        </td>

                                        <td className="p-3 text-left font-medium border-r border-gray-200 border-b text-gray-700">
                                            {pmData.time}
                                        </td>

                                        <td className="p-2 border-b border-gray-200">
                                            {pmData.project && (
                                                <TaskEntry
                                                    project={pmData.project}
                                                    startTime={pmData.startTime}
                                                    endTime={pmData.endTime}
                                                />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportDailyTimeSheet;