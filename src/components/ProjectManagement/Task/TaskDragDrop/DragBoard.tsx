/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import Column from "./Column";
import type { Dispatch, SetStateAction } from "react";

const columns = ["todo", "in_progress", "pending"] as const;

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


const DragBoard = ({ task, setTasks }: { task: Task[]; setTasks: Dispatch<SetStateAction<Task[]>> }) => {

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id;
        const newStatus = over.id;

        const dTask = task.find((t) => t.id === taskId);

        setTasks((prev:any) =>
            prev.map((t: Task) =>
                t.id === taskId && t.status !== newStatus
                    ? { ...t, status: newStatus }
                    : t
            )
        );
        if (dTask && dTask.status !== newStatus) {
            // updateTodo({ id: taskId, data: { status: newStatus } });
            console.log('update');
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // user must move 5px before drag starts
            },
        })
    );

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {columns.map((col) => (
                    <Column key={col} id={col} label={col} task={task.filter((t) => t.status === col)} />
                ))}
            </div>
        </DndContext>
    );
};

export default DragBoard;
