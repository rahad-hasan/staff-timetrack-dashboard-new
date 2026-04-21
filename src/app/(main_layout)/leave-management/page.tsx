import { redirect } from "next/navigation";

import { getDecodedUser } from "@/utils/decodedLogInUser";

const LeaveManagementIndexPage = async () => {
  const currentUser = await getDecodedUser();
  const role = currentUser?.role ?? "";
  const isManagerial =
    !role || ["admin", "manager", "hr", "project_manager"].includes(role);

  redirect(isManagerial ? "/leave-management/leave-types" : "/leave-management/my-leaves");
};

export default LeaveManagementIndexPage;
