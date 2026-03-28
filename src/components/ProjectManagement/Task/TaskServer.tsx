/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTasks } from "@/actions/task/action";
import TaskToggle from "./TaskToggle";
import AppPagination from "@/components/Common/AppPagination";

const TaskServer = async ({ searchParams }: any) => {
    const params = await searchParams;
    const result = await getTasks({
        search: params.search,
        project_id: params.project_id,
        user_id: params.user_id,
        page: params.page,
        status: params.status
    });

    return (
        <div>
            <TaskToggle data={result.data} />
            <AppPagination
                total={result?.meta?.total ?? 1}
                currentPage={params.page}
                limit={result?.meta?.limit ?? 10}
            />
        </div>
    );
};

export default TaskServer;