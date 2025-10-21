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
import { ITask } from "@/global/globalTypes";

const columns = ["todo", "in_progress", "pending"] as const;



const DragBoard = ({ task, setTasks }: { task: ITask[]; setTasks: Dispatch<SetStateAction<ITask[]>> }) => {

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id;
        const newStatus = over.id;

        const dTask = task.find((t) => t.id === taskId);

        // update in ui
        setTasks((prev: any) =>
            prev.map((t: ITask) =>
                t.id === taskId && t.status !== newStatus
                    ? { ...t, status: newStatus }
                    : t
            )
        );

        // here i will call api for updated value
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {columns.map((col) => (
                    <Column key={col} id={col} label={col} task={task.filter((t) => t.status === col)} />
                ))}
            </div>
        </DndContext>
    );
};

export default DragBoard;
