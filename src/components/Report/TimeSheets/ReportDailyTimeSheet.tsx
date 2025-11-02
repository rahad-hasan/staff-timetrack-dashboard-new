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

        const tracks: any = []; // tracks means columns

        const tasksWithTrack = sortedTasks.map(task => {
            const currentTaskStart = timeToMinutes(task.startTime);
            const currentTaskEnd = timeToMinutes(task.endTime);

            let assignedTrackIndex = -1;

            for (let i = 0; i < tracks.length; i++) {
                const laneEndTime = tracks[i];
                if (currentTaskStart >= laneEndTime) {
                    assignedTrackIndex = i;
                    tracks[i] = currentTaskEnd;
                    break;
                }
            }

            if (assignedTrackIndex === -1) {
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
        console.log('tasksWithTrack', tasksWithTrack);
        console.log('tracks', tracks);

        const maxTracks = tracks.length;

        return tasksWithTrack.map(task => {
            const baseWidth = 100 / maxTracks;

            return {
                ...task,
                // Vertical (Positioning based on minutes converted to %)
                topPosition: (task.startMinutes / TOTAL_MINUTES_IN_DAY) * 100,
                heightPercentage: (task.durationMinutes / TOTAL_MINUTES_IN_DAY) * 100,
                // Horizontal (Positioning based on track index)
                leftPercentage: task.trackIndex * baseWidth,
                widthPercentage: baseWidth,
                maxTracks: maxTracks
            };
        });
    }, [taskEntries]);


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
        const marginLeftPx = trackIndex === 0 ? 1 : 2;

        // return (
        //     <div
        //         className={`flex flex-col ${baseClasses} ${colorClasses}`}
        //         style={{
        //             top: `${topPosition}%`,
        //             height: `${heightPercentage}%`,
        //             left: `calc(${leftPercentage}% + ${marginLeftPx}px)`,
        //             width: `calc(${widthPercentage}% - ${maxTracks > 1 ? 2 : 0}px)`,
        //             minHeight: '2rem'
        //         }}
        //     >
        //         <div className="">{project}</div>
        //         <div className="font-normal text-base opacity-80 mt-1">
        //             {formattedStartTime} - {formattedEndTime}
        //         </div>
        //     </div>
        // );

        return (
            <div
                className={`flex flex-col ${baseClasses} ${colorClasses}`}
                style={{
                    top: `${topPosition}%`,
                    height: `${heightPercentage}%`,
                    left: `calc(${trackIndex * 300}px + ${marginLeftPx}px)`,
                    width: `calc(${300}px - ${maxTracks > 1 ? 2 : 0}px)`,
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

            <div className="  overflow-x-auto">
                <div className="flex  pb-2">
                    <div className="w-[80px] flex-shrink-0 font-bold text-sm text-gray-600 text-center dark:text-darkTextPrimary">Time</div>
                    <div className="flex-grow font-bold text-sm text-gray-600 ml-4"></div>
                </div>

                <div className="flex min-w-[800px] border-t border-gray-200">

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