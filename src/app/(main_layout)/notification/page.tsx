import { getNotifications, getNotificationsCount } from "@/actions/notification/action";
import AppPagination from "@/components/Common/AppPagination";
import AllNotification from "@/components/Notification/AllNotification";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const NotificationPage = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const currentUser = await getDecodedUser();
    const canSeeUnusualActivity = ["admin", "hr"].includes(currentUser?.role ?? "");
    const result = await getNotifications({
        page: params.page,
        limit: 10,
        read: params.summary ?? null,
        by_reason: params.reasonType ?? null,
    });
    const notificationCount = await getNotificationsCount();

    return (
        <div>
            <AllNotification data={result?.data} canSeeUnusualActivity={canSeeUnusualActivity} notificationCount={notificationCount?.data}></AllNotification>
            <AppPagination
                total={result?.data?.meta?.total ?? 1}
                currentPage={params.page as number}
                limit={result?.data?.meta?.limit ?? 10}
            />
        </div>
    );
};

export default NotificationPage;