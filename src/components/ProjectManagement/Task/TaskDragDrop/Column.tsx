import { useDroppable } from "@dnd-kit/core";
import DraggableTask from "./DraggableTask";
import { ITask } from "@/global/globalTypes";

const Column = ({ id, label, task }: { id: string; label: string; task: ITask[] }) => {
    const { setNodeRef } = useDroppable({ id });

    const buttonClass = label === "todo"
        ? "border-1 py-0.5 px-2 border-[#5db0f1] text-[#5db0f1] dark:bg-darkSecondaryBg rounded-lg bg-white"
        : label === "in_progress"
            ? "border-1 py-0.5 px-2 border-[#ffcb49] text-[#ffcb49] dark:bg-darkSecondaryBg rounded-lg bg-white"
            : "border-1 py-0.5 px-2 border-[#12cd69] text-[#12cd69] dark:bg-darkSecondaryBg rounded-lg bg-white";

    const barClass = label === "todo"
        ? "bg-[#5db0f1] w-1.5 h-7 rounded-lg"
        : label === "in_progress"
            ? "bg-[#ffcb49] w-1.5 h-7 rounded-lg"
            : "bg-[#12cd69] w-1.5 h-7 rounded-lg";

    return (
        <div
            ref={setNodeRef}
            className="bg-[#f6f7f9] dark:bg-darkPrimaryBg border-2 border-borderColor dark:border-darkBorder rounded-lg p-4 min-h-[400px]"
        >

            <div className="flex items-center gap-2 mb-4">
                <span className={barClass}></span>
                <button className={`text-base font-semibold capitalize ${buttonClass}`}>
                    {label.replace("_", " ")}
                </button>
                <span className="text-sm bg-gray-200 dark:bg-darkSecondaryBg dark:border dark:border-darkBorder px-2.5 py-1 rounded-lg font-semibold">
                    {task.length}
                </span>
            </div>

            <div className="space-y-4">
                {task.map((t) => (
                    <DraggableTask key={t.id} task={t} />
                ))}
            </div>
        </div>
    );
};

export default Column;
