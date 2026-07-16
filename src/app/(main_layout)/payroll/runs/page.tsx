import { Metadata } from "next";
import { Suspense } from "react";

import HeadingComponent from "@/components/Common/HeadingComponent";
import PayrollAccessDenied from "@/components/Payroll/PayrollAccessDenied";
import PayrollRunsServer from "@/components/Payroll/PayrollRunsServer";
import PayrollSubNav from "@/components/Payroll/PayrollSubNav";
import PayrollSkeleton from "@/skeleton/payroll/PayrollSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { canManagePayroll } from "@/lib/payroll";
import { getDecodedUser } from "@/utils/decodedLogInUser";

export const metadata: Metadata = {
  title: "Payroll Runs",
  description: "History of monthly payroll runs with approvals and exports.",
};

const PayrollRunsPage = async ({ searchParams }: ISearchParamsProps) => {
  const currentUser = await getDecodedUser();
  const isAllowed = canManagePayroll(currentUser?.role);

  return (
    <div>
      <div className="mb-5">
        <HeadingComponent
          heading="Payroll Runs"
          subHeading="Review previously generated payroll periods. Approve draft runs, export CSV, and audit calculations."
        />
        <PayrollSubNav canManage={isAllowed} />
      </div>

      {isAllowed ? (
        <Suspense fallback={<PayrollSkeleton />}>
          <PayrollRunsServer searchParams={searchParams} />
        </Suspense>
      ) : (
        <PayrollAccessDenied />
      )}
    </div>
  );
};

export default PayrollRunsPage;
