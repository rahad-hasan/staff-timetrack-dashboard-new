import {
    useDroppable,
} from "@dnd-kit/core";
import DraggableTask from "./DraggableTask";

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

const Column = ({ id, label, task }: { id: string; label: string; task: Task[] }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className="bg-gray-50 border dark:bg-gray-900 dark:text-gray-100 border-gray-200 rounded-lg p-4 min-h-[400px] shadow-sm"
        >
            <h3 className="text-lg font-semibold mb-4 capitalize">{label.replace("_", " ")}</h3>
            <div className="space-y-4">
                {task.map((t) => (
                    <DraggableTask key={t.id} task={t} />
                ))}
            </div>
        </div>
    );
};
export default Column;