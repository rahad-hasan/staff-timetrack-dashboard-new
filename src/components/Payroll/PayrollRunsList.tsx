"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Eye, FileDown, Plus } from "lucide-react";

import AppPagination from "@/components/Common/AppPagination";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatPayrollMoney,
  formatPayrollPeriod,
  monthName,
} from "@/lib/payroll";
import {
  PayrollRun,
  PayrollRunStatus,
  PAYROLL_RUN_STATUSES,
  RUN_STATUS_LABELS,
} from "@/types/payroll";
import { IMeta } from "@/types/type";
import { downloadPayrollExport } from "./payrollExport";
import PayrollEmptyState from "./PayrollEmptyState";
import { PayrollRunStatusBadge } from "./PayrollBadges";

interface PayrollRunsListProps {
  runs: PayrollRun[];
  meta: IMeta;
  filters: {
    year?: number;
    month?: number;
    status?: PayrollRunStatus;
  };
}

const ALL = "all";

const PayrollRunsList = ({ runs, meta, filters }: PayrollRunsListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

  const setParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleExport = async (runId: number) => {
    await downloadPayrollExport(runId);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[12px] border border-borderColor p-4 sm:p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
                Year
              </p>
              <Select
                value={filters.year ? String(filters.year) : ALL}
                onValueChange={(value) => setParam("year", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any year</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
                Month
              </p>
              <Select
                value={filters.month ? String(filters.month) : ALL}
                onValueChange={(value) => setParam("month", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any month</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={String(month)}>
                      {monthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
                Status
              </p>
              <Select
                value={filters.status ?? ALL}
                onValueChange={(value) => setParam("status", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any status</SelectItem>
                  {PAYROLL_RUN_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {RUN_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button asChild>
            <Link href="/payroll/generate">
              <Plus className="size-4" />
              Generate payroll
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-borderColor dark:border-darkBorder dark:bg-darkSecondaryBg">
        {runs.length === 0 ? (
          <PayrollEmptyState text="No payroll runs match the selected filters." />
        ) : (
          <>
            <div className="hidden pb-3 md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Total Gross</TableHead>
                    <TableHead>Total Net</TableHead>
                    <TableHead>Generated by</TableHead>
                    <TableHead>Approved by</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                        {formatPayrollPeriod(run.month, run.year)}
                      </TableCell>
                      <TableCell>
                        <PayrollRunStatusBadge status={run.status} />
                      </TableCell>
                      <TableCell className="text-sm text-subTextColor dark:text-darkTextSecondary">
                        {run.generated_count} / {run.total_employees}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatPayrollMoney(run.total_gross, run.currency)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatPayrollMoney(run.total_net, run.currency)}
                      </TableCell>
                      <TableCell className="text-sm text-subTextColor dark:text-darkTextSecondary">
                        {run.generatedBy ? (
                          <div>
                            <p className="text-headingTextColor dark:text-darkTextPrimary">
                              {run.generatedBy.name}
                            </p>
                            <p className="text-xs">
                              {formatDistanceToNow(parseISO(run.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-subTextColor dark:text-darkTextSecondary">
                        {run.approvedBy && run.approved_at ? (
                          <div>
                            <p className="text-headingTextColor dark:text-darkTextPrimary">
                              {run.approvedBy.name}
                            </p>
                            <p className="text-xs">
                              {format(parseISO(run.approved_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/payroll/runs/${run.id}`}>
                              <Eye className="size-4" />
                              View
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExport(run.id)}
                          >
                            <FileDown className="size-4" />
                            Export
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="divide-y divide-borderColor md:hidden dark:divide-darkBorder">
              {runs.map((run) => (
                <li key={run.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-headingTextColor dark:text-darkTextPrimary">
                        {formatPayrollPeriod(run.month, run.year)}
                      </p>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                        {run.generated_count} / {run.total_employees} employees
                      </p>
                    </div>
                    <PayrollRunStatusBadge status={run.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                        Gross
                      </p>
                      <p>{formatPayrollMoney(run.total_gross, run.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                        Net
                      </p>
                      <p className="font-medium">
                        {formatPayrollMoney(run.total_net, run.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button asChild variant="outline2" size="sm">
                      <Link href={`/payroll/runs/${run.id}`}>
                        <Eye className="size-4" />
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport(run.id)}
                    >
                      <FileDown className="size-4" />
                      Export
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {meta.total > meta.limit && (
        <AppPagination
          total={meta.total}
          currentPage={meta.page}
          limit={meta.limit}
        />
      )}
    </div>
  );
};

export default PayrollRunsList;
