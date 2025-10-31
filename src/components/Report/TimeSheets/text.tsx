/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import { useMemo, useState } from "react";

const ReportDailyTimeSheet = () => {
    console.log("ReportDailyTimeSheet");
    const users = [
        {
            value: "Juyed Ahmed",
            label: "Juyed Ahmed",
            avatar: "https://avatar.iran.liara.run/public/18",
        },
        {
            value: "Cameron Williamson",
            label: "Cameron Williamson",
            avatar: "https://avatar.iran.liara.run/public/19",
        },
        {
            value: "Jenny Wilson",
            label: "Jenny Wilson",
            avatar: "https://avatar.iran.liara.run/public/20",
        },
        {
            value: "Esther Howard",
            label: "Esther Howard",
            avatar: "https://avatar.iran.liara.run/public/21",
        },
        {
            value: "Walid Ahmed",
            label: "Walid Ahmed",
            avatar: "https://avatar.iran.liara.run/public/22",
        },
    ]

    // date picker
    const [selectedDate, setSelectedDate] = useState(new Date());

    const taskEntries = [
        { project: 'Project Alpha', startTime: '05:34', endTime: '09:19', color: 'yellow' },
        { project: 'Project Alpha', startTime: '07:34', endTime: '10:19', color: 'yellow' },
        { project: 'Project Beta', startTime: '14:41', endTime: '16:31', color: 'amber' },
        { project: 'Project Gamma', startTime: '17:55', endTime: '19:05', color: 'yellow' },
    ];

    // Time sheet timeline calculations
    const TOTAL_MINUTES_IN_DAY = 24 * 60; // 1440
    const ITEM_WIDTH_PX = 300; // New fixed width for each entry

    const timeToMinutes = (timeString: string) => {
        if (!timeString) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const getDurationMinutes = (startTime: string, endTime: string) => {
        return timeToMinutes(endTime) - timeToMinutes(startTime);
    };

    const tasksWithLayout = useMemo(() => {
        const sortedTasks = [...taskEntries].sort((a, b) =>
            timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        );

        // --- Simplified overlap check to determine shiftIndex (column) ---
        // Group tasks by their overlap period
        const taskGroups: any[][] = [];

        sortedTasks.forEach(task => {
            const currentTaskStart = timeToMinutes(task.startTime);
            const currentTaskEnd = timeToMinutes(task.endTime);
            let placed = false;

            // Try to place the task into an existing group (column)
            for (let i = 0; i < taskGroups.length; i++) {
                const group = taskGroups[i];
                // Check if the current task overlaps with ANY task in this group
                const isOverlapping = group.some(existingTask => {
                    const existingStart = existingTask.startMinutes;
                    const existingEnd = existingTask.endMinutes; // Added endMinutes to type, but using currentTaskEnd for simplicity here
                    
                    // Standard overlap logic:
                    // Task A starts before Task B ends AND Task A ends after Task B starts
                    return currentTaskStart < existingEnd && currentTaskEnd > existingStart;
                });
                
                // If it does NOT overlap with ANY task in the group, we can place it here
                // NOTE: The previous logic was about finding a track that finished before the new task started.
                // For a side-by-side fixed-width layout, we need to know how many overlaps *at any point* there are.
                // A simpler approach for the fixed-width columns is often preferred. 
                // However, for pure side-by-side (like a calendar day view), we need to find the first *available* column (track).
                
                // For demonstration, let's use the simplest: only overlap with the *last* item in the track.
                const lastItem = group[group.length - 1];
                if (currentTaskStart >= lastItem.endMinutes) {
                    taskGroups[i].push({ 
                        ...task, 
                        startMinutes: currentTaskStart,
                        endMinutes: currentTaskEnd,
                        durationMinutes: getDurationMinutes(task.startTime, task.endTime)
                    });
                    placed = true;
                    break;
                }
            }
            
            // If it can't be placed in an existing group, start a new group (new column)
            if (!placed) {
                taskGroups.push([{ 
                    ...task, 
                    startMinutes: currentTaskStart,
                    endMinutes: currentTaskEnd, // Temporarily add endMinutes for placement logic
                    durationMinutes: getDurationMinutes(task.startTime, task.endTime)
                }]);
            }
        });

        // Flatten groups and assign the trackIndex (column)
        let tasksWithTrack: any[] = [];
        taskGroups.forEach((group, trackIndex) => {
             group.forEach(task => {
                tasksWithTrack.push({ ...task, trackIndex });
             })
        });

        // Let's use the maximum number of tracks for the container width calculation, 
        // though each item's width is fixed.
        const maxTracks = taskGroups.length;

        // --- Apply Layout Calculations ---
        return tasksWithTrack.map(task => {
            return {
                ...task,
                // Vertical (Positioning based on minutes converted to %)
                topPosition: (task.startMinutes / TOTAL_MINUTES_IN_DAY) * 100,
                heightPercentage: (task.durationMinutes / TOTAL_MINUTES_IN_DAY) * 100,
                // Horizontal (Positioning based on track index)
                trackIndex: task.trackIndex,
                // The fixed width and left position will be applied in the TimelineEntry component
            };
        });
    }, [taskEntries]);

    // Calculate the necessary min-width for the timeline based on the widest overlap
    const maxTracks = tasksWithLayout.reduce((max, task) => Math.max(max, task.trackIndex + 1), 1);
    const minTimelineContentWidth = maxTracks * ITEM_WIDTH_PX;

    // --- End of Time sheet timeline calculations ---

    const timeLineHours = Array.from({ length: 24 }, (_, i) => i);

    type TimelineEntryProps = {
        project: string;
        startTime: string;
        endTime: string;
        color?: string;
        topPosition: number;
        heightPercentage: number;
        trackIndex: number; // Used for horizontal positioning
    };
    
    const TimelineEntry = ({ project, startTime, endTime, color, topPosition, heightPercentage, trackIndex }: TimelineEntryProps) => {

        const baseClasses = 'absolute p-2 text-xs font-semibold rounded-lg border-l-4 shadow-lg z-10 transition-all duration-300 hover:shadow-xl';
        let colorClasses;

        if (color === 'yellow' || color === 'amber') { // Added 'amber' to a color class
            colorClasses = 'bg-[#fff5db] text-black border-yellow-400';
        } else {
            colorClasses = 'bg-[#fee6eb] text-black border-red-500';
        }

        const formattedStartTime = startTime;
        const formattedEndTime = endTime;
        
        // Calculate horizontal position based on fixed width and track index
        const leftPositionPx = trackIndex * ITEM_WIDTH_PX;

        return (
            <div
                className={`flex flex-col ${baseClasses} ${colorClasses}`}
                style={{
                    top: `${topPosition}%`,
                    height: `${heightPercentage}%`,
                    left: `${leftPositionPx}px`, // Use fixed pixel position for side-by-side
                    width: `${ITEM_WIDTH_PX}px`, // Use fixed pixel width
                    minHeight: '2rem'
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
                <SelectUserDropDown users={users}></SelectUserDropDown>
            </div>

            <div className=" rounded-xl overflow-x-auto">
                <div className="flex pb-2">
                    <div className="w-[80px] flex-shrink-0 font-bold text-sm text-gray-600 text-center dark:text-darkTextPrimary">Time</div>
                    <div className="flex-grow font-bold text-sm text-gray-600 ml-4"></div>
                </div>

                <div className="flex border-t border-gray-200"> {/* Removed min-w-[800px] here */}

                    <div className="w-[80px]">
                        {timeLineHours.map((hour) => (
                            <div
                                key={hour}
                                className="h-[60px] text-xs font-medium text-gray-500 flex items-center justify-center border-b border-borderColor dark:text-darkTextSecondary"
                            >
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    <div 
                        className="flex-grow relative border-l border-gray-200" 
                        style={{ 
                            height: `${TOTAL_MINUTES_IN_DAY / 60 * 60}px`,
                            minWidth: `${minTimelineContentWidth}px` // Ensure enough width for all side-by-side elements
                        }}>

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