import { listPayrollRuns } from "@/actions/payroll/action";
import { PayrollRunStatus, PAYROLL_RUN_STATUSES } from "@/types/payroll";
import { ISearchParamsProps } from "@/types/type";
import PayrollRunsList from "./PayrollRunsList";

const parseStatus = (value: unknown): PayrollRunStatus | undefined => {
  return typeof value === "string" &&
    (PAYROLL_RUN_STATUSES as string[]).includes(value)
    ? (value as PayrollRunStatus)
    : undefined;
};

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value !== "string") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const DEFAULT_LIMIT = 20;

const PayrollRunsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;

  const year = parseNumber(params.year);
  const month = parseNumber(params.month);
  const status = parseStatus(params.status);
  const page = parseNumber(params.page) ?? 1;

  const response = await listPayrollRuns({
    year,
    month,
    status,
    page,
    limit: DEFAULT_LIMIT,
  });

  const runs = response?.success && Array.isArray(response.data)
    ? response.data
    : [];

  return (
    <PayrollRunsList
      runs={runs}
      meta={
        response?.meta ?? {
          page,
          limit: DEFAULT_LIMIT,
          total: runs.length,
          totalPages: 1,
        }
      }
      filters={{ year, month, status }}
    />
  );
};

export default PayrollRunsServer;
