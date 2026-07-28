/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    useDraggable,
} from "@dnd-kit/core";
import TaskCart from "./TaskCart";


const DraggableTask = ({ task }: { task: any }) => {
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