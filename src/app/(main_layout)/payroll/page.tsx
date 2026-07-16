import { redirect } from "next/navigation";

import { canManagePayroll } from "@/lib/payroll";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const PayrollIndexPage = async () => {
  const currentUser = await getDecodedUser();
  if (canManagePayroll(currentUser?.role)) {
    redirect("/payroll/runs");
  }
  redirect("/payroll/my-payslips");
};

export default PayrollIndexPage;
