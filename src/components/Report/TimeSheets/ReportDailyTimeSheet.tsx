/* eslint-disable @typescript-eslint/no-explicit-any */
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";

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

    const taskEntries = [
        { project: 'Project Alpha', startTime: '05:34', endTime: '09:19', color: 'yellow' }, // Overlap Group 1 (Track 0)
        { project: 'Project Alpha', startTime: '07:34', endTime: '10:19', color: 'yellow' }, // Overlap Group 1 (Track 1)
        { project: 'Project Beta', startTime: '14:41', endTime: '16:31', color: 'amber' },  // Track 0
        { project: 'Project Gamma', startTime: '17:55', endTime: '19:05', color: 'yellow' }, // Track 0
    ];

    const TOTAL_MINUTES_IN_DAY = 24 * 60; // 1440

    // Helper to convert "HH:MM" to minutes from midnight
    const timeToMinutes = (timeString:string) => {
        if (!timeString) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Helper to calculate duration in minutes
    const getDurationMinutes = (startTime: string, endTime:string) => {
        return timeToMinutes(endTime) - timeToMinutes(startTime);
    };

    // --- Overlap Detection and Layout Calculation ---
    const tasksWithLayout = useMemo(() => {
        // 1. Sort tasks by start time
        const sortedTasks = [...taskEntries].sort((a, b) =>
            timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        );

        console.log('sortedTasks',sortedTasks);

        // 2. Greedy Track Assignment: Find the minimum number of tracks (lanes) required. 
        // This number (maxTracks) is equal to the maximum concurrent overlap at any time.
        const tracks:any = []; // Stores the end time (in minutes) of the last task placed in each lane

        const tasksWithTrack = sortedTasks.map(task => {
            const currentTaskStart = timeToMinutes(task.startTime);
            const currentTaskEnd = timeToMinutes(task.endTime);

            let assignedTrackIndex = -1;

            // Try to find the first track where the last task has already ended
            for (let i = 0; i < tracks.length; i++) {
                const laneEndTime = tracks[i];
                if (currentTaskStart >= laneEndTime) {
                    assignedTrackIndex = i;
                    tracks[i] = currentTaskEnd; // Update lane end time
                    break;
                }
            }

            if (assignedTrackIndex === -1) {
                // No available track, start a new one
                assignedTrackIndex = tracks.length;
                tracks.push(currentTaskEnd);
            }

            return {
                ...task,
                trackIndex: assignedTrackIndex,
                startMinutes: currentTaskStart,
                durationMinutes: getDurationMinutes(task.startTime, task.endTime),
            };
        });
        console.log('tracks',tracks);

        // 3. Determine maximum concurrency and calculate layout properties
        const maxTracks = tracks.length;

        return tasksWithTrack.map(task => {
            const baseWidth = 100 / maxTracks;

            return {
                ...task,
                // Vertical (Positioning based on minutes converted to %)
                topPosition: (task.startMinutes / TOTAL_MINUTES_IN_DAY) * 100,
                heightPercentage: (task.durationMinutes / TOTAL_MINUTES_IN_DAY) * 100,

                // Horizontal (Positioning based on tracks)
                leftPercentage: task.trackIndex * baseWidth,
                widthPercentage: baseWidth,
                maxTracks: maxTracks
            };
        });
    }, [taskEntries]);
    // --- Overlap Detection and Layout Calculation End ---

    console.log(tasksWithLayout);


    // 24-hour axis labels
    const timeLineHours = Array.from({ length: 24 }, (_, i) => i);

    type TimelineEntryProps = {
        project: string;
        startTime: string;
        endTime: string;
        color?: string;
        topPosition: number;
        heightPercentage: number;
        leftPercentage: number;
        widthPercentage: number;
        trackIndex: number;
        maxTracks: number;
    };
    const TimelineEntry = ({ project, startTime, endTime, color, topPosition, heightPercentage, leftPercentage, widthPercentage, trackIndex, maxTracks }: TimelineEntryProps) => {

        const baseClasses = 'absolute p-2 text-xs font-semibold rounded-lg border-l-4 shadow-lg z-10 transition-all duration-300 hover:shadow-xl';
        let colorClasses;

        if (color === 'yellow') {
            colorClasses = 'bg-[#fff5db] text-black border-yellow-400';
        } else {
            colorClasses = 'bg-[#fee6eb] text-black border-red-500';
        }

        const formattedStartTime = startTime;
        const formattedEndTime = endTime;

        // Horizontal position using dynamic width and left percentage
        // Apply 2px margin-right for separation, only if it's not the last track
        const marginLeftPx = trackIndex === 0 ? 0 : 2; // Add 2px margin-left for all except the first track

        return (
            <div
                className={`flex flex-col ${baseClasses} ${colorClasses}`}
                style={{
                    top: `${topPosition}%`,
                    height: `${heightPercentage}%`,
                    left: `calc(${leftPercentage}% + ${marginLeftPx}px)`, // Adjust left position by 2px margin of previous track
                    width: `calc(${widthPercentage}% - ${maxTracks > 1 ? 2 : 0}px)`, // Adjust width to accommodate 2px separation
                    minHeight: '2rem' // Ensure minimum visibility for short tasks
                }}
            >
                <div className="">{project}</div>
                <div className="font-normal text-base opacity-80 mt-1">
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
                        <SelectTrigger size={'lg'} className=" w-full md:w-[250px]">
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

            <div className=" rounded-xl overflow-x-auto">
                <div className="flex  pb-2">
                    <div className="w-[80px] flex-shrink-0 font-bold text-sm text-gray-600 text-center">Time</div>
                    <div className="flex-grow font-bold text-sm text-gray-600 ml-4"></div>
                </div>

                <div className="flex min-w-[800px] border-t border-gray-200">

                    <div className="w-[80px]">
                        {timeLineHours.map((hour) => (
                            <div
                                key={hour}
                                className="h-[60px] text-xs font-medium text-gray-500 flex items-center justify-center border-b border-borderColor"
                            >
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    <div className="flex-grow relative border-l border-gray-200 " style={{ height: `${TOTAL_MINUTES_IN_DAY / 60 * 60}px` }}>

                        {timeLineHours.map((hour) => (
                            <div
                                key={`grid-${hour}`}
                                className="absolute left-0 right-0 border-b border-borderColor"
                                style={{ top: `${(hour / 24) * 100}%`, height: '60px', zIndex: 0 }}
                            >
                                <div className="h-full"></div>
                            </div>
                        ))}

                        {tasksWithLayout.map((entry, index) => (
                            <TimelineEntry
                                key={index}
                                {...entry}
                            />
                        ))}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportDailyTimeSheet;