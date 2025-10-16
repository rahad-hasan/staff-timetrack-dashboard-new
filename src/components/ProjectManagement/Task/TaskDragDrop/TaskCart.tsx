import React from 'react';

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

const TaskCart = ({ task }: { task: Task }) => {
    return (
        <div className=" border p-6 rounded-lg bg-primary text-white cursor-grab" >
            <p>{task?.taskName}</p>
            <p>{task?.assignee}</p>
            <p>{task?.timeWorked}</p>
        </div>
    );
};

export default TaskCart;