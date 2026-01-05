/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTasks } from "@/actions/task/action";
import TaskToggle from "./TaskToggle";

const TaskServer = async ({ searchParams }: any) => {
    const params = await searchParams;
    const result = await getTasks({
        search: params.search,
        project_id: params.project_id,
        user_id: params.user_id
    });

    return (
        <div>
            <TaskToggle data={result.data} />
        </div>
    );
};

export default TaskServer;