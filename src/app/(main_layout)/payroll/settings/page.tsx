import { Metadata } from "next";
import { Suspense } from "react";

import HeadingComponent from "@/components/Common/HeadingComponent";
import PayrollSubNav from "@/app/(main_layout)/payroll/_components/PayrollSubNav";
import PayrollSettingsServer from "@/app/(main_layout)/payroll/settings/_components/PayrollSettingsServer";
import PayrollSkeleton from "@/skeleton/payroll/PayrollSkeleton";
import { ISearchParamsProps } from "@/types/type";

export const metadata: Metadata = {
  title: "Payroll Settings",
  description: "Manage employee payroll profiles and salary configuration.",
};

const PayrollSettingsPage = ({ searchParams }: ISearchParamsProps) => {
  return (
    <div>
      <div className="mb-5">
        <HeadingComponent
          heading="Payroll Settings"
          subHeading="Configure salary profiles, hourly rates, overtime, and effective periods for every employee."
        />
        <PayrollSubNav canManage />
      </div>

      <Suspense fallback={<PayrollSkeleton />}>
        <PayrollSettingsServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
};

export default PayrollSettingsPage;
