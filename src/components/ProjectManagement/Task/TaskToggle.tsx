"use client"
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import TaskTable from "./TaskTable";
import { loadOrReload } from "@/lib/lazyChunk";
import KanbanDndListSkeleton from "@/skeleton/projectManagement/task/KanbanDndListSkeleton";
import { ITask } from "@/types/type";

// The board (dnd-kit, the Radix slider) is only drawn for ?tab=Kanban, which
// no control sets at present (the tab switch in TaskHeroSection is commented
// out), so it is its own chunk rather than part of every visit to the list.
// Server-rendered as before should a link ever ask for it.
const loadKanbanDndList = loadOrReload(() => import("./KanbanDndList"));
const KanbanDndList = dynamic(loadKanbanDndList, {
    loading: () => <KanbanDndListSkeleton />,
});

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