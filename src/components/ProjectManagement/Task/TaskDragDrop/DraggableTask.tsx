import {
    useDraggable,
} from "@dnd-kit/core";
import TaskCart from "./TaskCart";

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

const DraggableTask = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: task.id,
    });

    const style = {
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCart task={task} />
        </div>
    );
};
export default DraggableTask;