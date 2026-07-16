import { Metadata } from "next";
import { Suspense } from "react";

import HeadingComponent from "@/components/Common/HeadingComponent";
import MyPayslipsServer from "@/components/Payroll/MyPayslipsServer";
import PayrollSubNav from "@/components/Payroll/PayrollSubNav";
import PayrollSkeleton from "@/skeleton/payroll/PayrollSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { canManagePayroll } from "@/lib/payroll";
import { getDecodedUser } from "@/utils/decodedLogInUser";

export const metadata: Metadata = {
  title: "My Payslips",
  description: "Review your monthly payslips and salary breakdowns.",
};

const MyPayslipsPage = async ({ searchParams }: ISearchParamsProps) => {
  const currentUser = await getDecodedUser();

  return (
    <div>
      <div className="mb-5">
        <HeadingComponent
          heading="My Payslips"
          subHeading="Every approved payslip issued for your account. Open a card to see the calculation breakdown."
        />
        <PayrollSubNav canManage={canManagePayroll(currentUser?.role)} />
      </div>

      <Suspense fallback={<PayrollSkeleton />}>
        <MyPayslipsServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
};

export default MyPayslipsPage;
