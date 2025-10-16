"use client"
import { useState } from "react";
import DragBoard from "./TaskDragDrop/DragBoard";

const KanbanDndList = () => {
    type TaskStatus = "todo" | "pending" | "in_progress" | "completed";
    type TaskPriority = "None" | "Low" | "Medium" | "High";

    interface Task {
        id: string;
        taskName: string;
        project: string;
        image: string;
        assignee: string;
        timeWorked: string; // e.g., "12:03:00" (HH:mm:ss)
        priority: TaskPriority;
        status: TaskStatus;
    }

    const [taskList, setTaskList] = useState<Task[]>([
        {
            id: "s2as1fdazdsd14",
            taskName: "Do the Logic for Orbit Home page project",
            project: "Orbit Technology's project",
            image: "https://avatar.iran.liara.run/public/25",
            assignee: "Juyed Ahmed",
            timeWorked: "12:03:00",
            priority: "Low",
            status: "in_progress",
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
        },
        {
            id: "s2as1fd541ds96",
            taskName: "Design Idea",
            project: "Orbit Technology's project",
            image: "https://avatar.iran.liara.run/public/26",
            assignee: "Jenny Wilson",
            timeWorked: "11:03:00",
            priority: "None",
            status: "in_progress",
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
        },
    ]);

    return (
        <div className="  mt-5">
            <DragBoard task={taskList} setTasks={setTaskList}></DragBoard>
        </div>
    );
};

export default KanbanDndList;