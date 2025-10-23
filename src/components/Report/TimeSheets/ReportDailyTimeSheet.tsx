import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";


const ReportDailyTimeSheet = () => {
    console.log("ReportDailyTimeSheet");
    const users = [
        { name: "Juyed Ahmed", avatar: "https://avatar.iran.liara.run/public/18" },
        { name: "Cameron Williamson", avatar: "https://avatar.iran.liara.run/public/19" },
        { name: "Jenny Wilson", avatar: "https://avatar.iran.liara.run/public/20" },
        { name: "Esther Howard", avatar: "https://avatar.iran.liara.run/public/21" }
    ];

    const [userSearch, setUserSearch] = useState("");
    const [user, setUser] = useState("Juyed Ahmed");

    const filteredUsers = users.filter(t => t.name.toLowerCase().includes(userSearch.toLowerCase()));
    const selectedUser = users.find((u) => u.name === user);

    // date picker
    const [selectedDate, setSelectedDate] = useState(new Date());

    // timeline table
    const taskEntries = [
        { project: 'Project Alpha', startTime: '05:34', endTime: '09:19', color: 'yellow' }, // 105 mins
        { project: 'Project Alpha', startTime: '07:34', endTime: '10:19', color: 'yellow' },
        { project: 'Project Beta', startTime: '14:41', endTime: '16:31', color: 'amber' }, // 110 mins
        { project: 'Project Gamma', startTime: '17:55', endTime: '19:05', color: 'yellow' }, // 70 mins
    ];

    const timeToMinutes = (timeString: string) => {
        if (!timeString) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const getDurationMinutes = (startTime: string, endTime: string) => {
        // console.log('startTime', startTime);
        // console.log('endTime', endTime);
        // console.log('endTimeFomatted', timeToMinutes(endTime));
        // console.log('startTimeFomatted', timeToMinutes(startTime));
        // console.log('hellooooo', timeToMinutes(endTime) - timeToMinutes(startTime));
        return timeToMinutes(endTime) - timeToMinutes(startTime);
    };

    const TOTAL_MINUTES_IN_DAY = 24 * 60; // 1440

    // 24-hour axis labels
    const timeLineHours = Array.from({ length: 24 }, (_, i) => i);


    const TimelineEntry = ({ project, startTime, endTime, color }: { project: string, startTime: string, endTime: string, color: string }) => {
        const startMinutes = timeToMinutes(startTime);
        const durationMinutes = getDurationMinutes(startTime, endTime);
        // console.log(startMinutes);
        // console.log(durationMinutes);

        const topPosition = (startMinutes / TOTAL_MINUTES_IN_DAY) * 100; // top as %
        const heightPercentage = (durationMinutes / TOTAL_MINUTES_IN_DAY) * 100; // height as %

        const baseClasses = 'absolute left-0 right-0 p-2 text-xs font-semibold rounded-sm border-l-4 shadow-md z-10';
        let colorClasses;

        if (color === 'yellow') {
            colorClasses = 'bg-[#fff5db] text-black border-yellow-400';
        } else {
            colorClasses = 'bg-[#fee6eb] text-black border-red-500';
        }

        const formattedStartTime = startTime;
        const formattedEndTime = endTime;

        return (
            <div
                className={`ml-0.5 w-[400px] ${baseClasses} ${colorClasses}`} // then place them side by side
                style={{
                    top: `${topPosition}%`,
                    height: `${heightPercentage}%`,
                }}
            >
                <div>
                    {project}
                </div>
                <div className="font-normal mt-1 h-[60px]">
                    {formattedStartTime} - {formattedEndTime}
                </div>
            </div>
        );
    };

    return (
        <div className="">
            <div className="mb-5 flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between">
                <SpecificDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></SpecificDatePicker>
                <div className=" w-full md:w-[250px]">
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

            <div className="flex border-gray-200 h-[30px]">
                <div className="w-[80px] flex items-center justify-center">
                    <p className="">Time</p>
                </div>
                <div className=" w-full flex items-center justify-center">
                    {/* <p>Tasks</p> */}
                </div>
            </div>
            <div className=" overflow-x-scroll">
                <div className="flex border-t border-gray-200 min-w-[1520px]">

                    <div className="w-[80px] flex-shrink-0">
                        {timeLineHours.map((hour) => (
                            <div
                                key={hour}
                                className="h-[60px] text-xs font-medium text-gray-500 flex items-center justify-center border-b "
                            >
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    <div className="flex-grow relative border-l " style={{ height: `${24 * 60}px` }}>

                        {timeLineHours.map((hour) => (
                            <div
                                key={`grid-${hour}`}
                                className="absolute left-0 right-0 border-b "
                                style={{ top: `${(hour / 24) * 100}%`, height: '60px', zIndex: 0 }}
                            >
                                <div className="h-full"></div>
                            </div>
                        ))}

                        {taskEntries.map((entry, index) => (
                            <TimelineEntry
                                key={index}
                                project={entry.project}
                                startTime={entry.startTime}
                                endTime={entry.endTime}
                                color={entry.color}
                            />
                        ))}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportDailyTimeSheet;