/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTasks } from "@/actions/task/action";
import TaskToggle from "./TaskToggle";
import AppPagination from "@/components/Common/AppPagination";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const TaskServer = async ({ searchParams }: any) => {
    const user = await getDecodedUser();
    const params = await searchParams;
    const result = await getTasks({
        search: params.search,
        project_id: params.project_id,
        user_id: params.user_id ?? user?.id,
        page: params.page,
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