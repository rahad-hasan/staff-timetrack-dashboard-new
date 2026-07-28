/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState } from "react";
import DragBoard from "./TaskDragDrop/DragBoard";
// import { ITask } from "@/global/globalTypes";

const KanbanDndList = () => {

    const [taskList, setTaskList] = useState<any>([
        {
            id: "s2as1fdazdsd14",
            taskName: "Do the Logic for Orbit Home page project",
            project: "Orbit Technology's project",
            image: "https://avatar.iran.liara.run/public/25",
            assignee: "Juyed Ahmed",
            timeWorked: "12:03:00",
            priority: "Low",
            status: "in_progress",
            checklist: 7,
        },
        {
            id: "s2as1fd45dxds4",
            taskName: "Marketing Tools",
            project: "Orbit Technology's project",
            image: "https://avatar.iran.liara.run/public/22",
            assignee: "Cameron Williamson",
            timeWorked: "12:03:00",
            priority: "Medium",
            status: "pending",
            checklist: 3,
        },
        {
            id: "s2as1fd541ds96",
            taskName: "Design Idea",
            project: "Orbit Technology's project",
            image: "https://avatar.iran.liara.run/public/26",
            assignee: "Jenny Wilson",
            timeWorked: "11:03:00",
            priority: "Urgent",
            status: "in_progress",
            checklist: 9,
        },
        {
            id: "s24d4ffds4df12",
            taskName: "Do the Logic for Orbit Home page project wi...",
            project: "Orbit Technology's project",
            image: "https://avatar.iran.liara.run/public/27",
            assignee: "Esther Howard",
            timeWorked: "10:03:00",
            priority: "Medium",
            status: "todo",
            checklist: 5,
        },
    ]);

    return (
        <div className="  mt-5">
            <DragBoard task={taskList} setTasks={setTaskList}></DragBoard>
        </div>
    );
};

export default KanbanDndList;