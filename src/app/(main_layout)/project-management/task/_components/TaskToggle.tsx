"use client"
import { useSearchParams } from "next/navigation";
import TaskTable from "./TaskTable";
import KanbanDndList from "./KanbanDndList";
import { ITask } from "@/types/type";

const TaskToggle = ({ data }: { data: ITask[] }) => {
    type Tab = "List view" | "Kanban";
    const searchParams = useSearchParams();
    const activeTab = (searchParams.get("tab") as Tab) ?? "List view";
    return (
        <div>
            {
                activeTab === "List view" &&
                <TaskTable data={data}></TaskTable>
            }
            {/* {
                activeTab === "List view" &&
                <TaskTableSkeleton></TaskTableSkeleton>
            } */}
            {
                activeTab === "Kanban" &&
                <KanbanDndList></KanbanDndList>
            }
            {/* {
                activeTab === "Kanban" &&
                <KanbanDndListSkeleton></KanbanDndListSkeleton>
            } */}
        </div>
    );
};

export default TaskToggle;