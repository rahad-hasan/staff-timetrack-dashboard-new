import {
  getNotifications,
  getNotificationsCount,
} from "@/actions/notification/action";
import AppPagination from "@/components/Common/AppPagination";
import AllNotification from "@/components/Notification/AllNotification";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const NotificationPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const category =
    params.read === "read" || params.read === "unread" ? params.read : "all";
  const read = category === "all" ? undefined : category === "read";
  const type =
    typeof params.type === "string" && params.type !== "all"
      ? params.type
      : undefined;

  // Independent reads: started together instead of one after the other.
  const [currentUser, result, notificationCount] = await Promise.all([
    getDecodedUser(),
    getNotifications({
      page: typeof params.page === "string" ? params.page : undefined,
      limit: 10,
      read,
      type,
    }),
    getNotificationsCount({ read }),
  ]);
  const canSeeUnusualActivity = ["admin", "hr"].includes(
    currentUser?.role ?? "",
  );

  return (
    <div>
      <AllNotification
        data={result?.data}
        canSeeUnusualActivity={canSeeUnusualActivity}
        notificationCount={notificationCount?.data}
        category={category}
        type={type}
      ></AllNotification>
      <AppPagination
        total={result?.data?.meta?.total ?? 1}
        currentPage={params.page as number}
        limit={result?.data?.meta?.limit ?? 10}
      />
    </div>
  );
};

export default NotificationPage;
