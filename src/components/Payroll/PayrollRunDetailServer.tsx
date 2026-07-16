import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getPayrollRun } from "@/actions/payroll/action";
import HeadingComponent from "@/components/Common/HeadingComponent";
import PayrollSubNav from "@/components/Payroll/PayrollSubNav";
import { Button } from "@/components/ui/button";
import PayrollRunDetailView from "./PayrollRunDetailView";

interface PayrollRunDetailServerProps {
  runId: number;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const parseNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== "string") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const PayrollRunDetailServer = async ({
  runId,
  searchParams,
}: PayrollRunDetailServerProps) => {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const page = parseNumber(params.page, 1);
  const limit = parseNumber(params.limit, 50);

  const response = await getPayrollRun(runId, {
    search: search || undefined,
    page,
    limit,
  });

  if (!response?.success || !response.data) {
    return (
      <div>
        <div className="mb-5">
          <div className="mb-3">
            <Button asChild variant="ghost" size="sm" className="pl-0">
              <Link href="/payroll/runs">
                <ChevronLeft className="size-4" />
                Back to runs
              </Link>
            </Button>
          </div>
          <HeadingComponent
            heading="Payroll run"
            subHeading="We couldn't load this payroll run."
          />
          <PayrollSubNav canManage />
        </div>
        <div className="rounded-[12px] border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {response?.message || "Payroll run not found."}
        </div>
      </div>
    );
  }

  return (
    <PayrollRunDetailView
      run={response.data.run}
      items={response.data.items}
      meta={
        response.meta ?? { page, limit, total: response.data.items.length, totalPages: 1 }
      }
      search={search}
    />
  );
};

export default PayrollRunDetailServer;
