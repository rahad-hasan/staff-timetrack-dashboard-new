/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTasks } from "@/actions/task/action";
import TaskToggle from "./TaskToggle";

const TaskServer = async ({ searchParams }: any) => {
    const result = await getTasks({
        search: searchParams.search,
        project_id: searchParams.project_id,
    });

    return (
        <div>
            <TaskToggle data={result.data} />
        </div>
    );
};

export default TaskServer;