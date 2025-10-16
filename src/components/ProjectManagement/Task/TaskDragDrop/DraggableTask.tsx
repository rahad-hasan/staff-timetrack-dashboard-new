import {
    useDraggable,
} from "@dnd-kit/core";
import TaskCart from "./TaskCart";
import { ITask } from "@/global/globalTypes";

const DraggableTask = ({ task }: { task: ITask }) => {
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