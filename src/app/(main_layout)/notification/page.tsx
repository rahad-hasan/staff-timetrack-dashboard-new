import { getNotifications } from "@/actions/notification/action";
import AppPagination from "@/components/Common/AppPagination";
import AllNotification from "@/components/Notification/AllNotification";
import { ISearchParamsProps } from "@/types/type";

const NotificationPage = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const result = await getNotifications({
        page: params.page,
        limit: 10
    });

    return (
        <div>
            <AllNotification data={result?.data}></AllNotification>
            <AppPagination
                total={result?.data?.meta?.total ?? 1}
                currentPage={params.page as number}
                limit={result?.data?.meta?.limit ?? 10}
            />
        </div>
    );
};

export default NotificationPage;