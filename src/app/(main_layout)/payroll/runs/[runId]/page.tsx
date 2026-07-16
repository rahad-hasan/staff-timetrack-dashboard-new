import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import PayrollAccessDenied from "@/components/Payroll/PayrollAccessDenied";
import PayrollRunDetailServer from "@/components/Payroll/PayrollRunDetailServer";
import PayrollSkeleton from "@/skeleton/payroll/PayrollSkeleton";
import { canManagePayroll } from "@/lib/payroll";
import { getDecodedUser } from "@/utils/decodedLogInUser";

export const metadata: Metadata = {
  title: "Payroll Run Details",
  description: "Employee-level payroll breakdown for a specific run.",
};

interface PageProps {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const PayrollRunDetailPage = async ({ params, searchParams }: PageProps) => {
  const { runId } = await params;
  const parsedRunId = Number(runId);
  if (!parsedRunId || Number.isNaN(parsedRunId)) {
    notFound();
  }

  const currentUser = await getDecodedUser();
  if (!canManagePayroll(currentUser?.role)) {
    return <PayrollAccessDenied />;
  }

  return (
    <Suspense fallback={<PayrollSkeleton />}>
      <PayrollRunDetailServer runId={parsedRunId} searchParams={searchParams} />
    </Suspense>
  );
};

export default PayrollRunDetailPage;
