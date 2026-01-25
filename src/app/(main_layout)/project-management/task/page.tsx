import TaskHeroSection from "@/components/ProjectManagement/Task/TaskHeroSection";
import { ISearchParamsProps } from "@/types/type";
import { Suspense } from "react";
import TaskServer from "@/components/ProjectManagement/Task/TaskServer";
import KanbanDndListSkeleton from "@/skeleton/projectManagement/task/KanbanDndListSkeleton";
import TaskTableSkeleton from "@/skeleton/projectManagement/task/TaskTableSkeleton";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Staff Time Tracker Task",
    description: "Staff Time Tracker Task",
};
const TaskPage = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    type Tab = "List view" | "Kanban";
    const tabs = (params?.tab as Tab) ?? "List view";

    const loadingFallback = tabs === "List view" ? <TaskTableSkeleton></TaskTableSkeleton> : <KanbanDndListSkeleton></KanbanDndListSkeleton>;

    return (
        <div>
            <TaskHeroSection></TaskHeroSection>

            <Suspense fallback={loadingFallback}>
                <TaskServer searchParams={searchParams} />
            </Suspense>

        </div>
    );
};

export default TaskPage;