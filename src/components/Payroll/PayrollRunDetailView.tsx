"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Coins,
  FileDown,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { approvePayrollRun } from "@/actions/payroll/action";
import AppPagination from "@/components/Common/AppPagination";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatPayrollHours,
  formatPayrollMoney,
  formatPayrollPeriod,
  isRunLocked,
} from "@/lib/payroll";
import { EmployeePayroll, PayrollRun } from "@/types/payroll";
import { IMeta } from "@/types/type";
import PayrollEmptyState from "./PayrollEmptyState";
import PayrollSubNav from "./PayrollSubNav";
import { PayrollRunStatusBadge, SalaryTypeBadge } from "./PayrollBadges";
import { downloadPayrollExport } from "./payrollExport";

interface PayrollRunDetailViewProps {
  run: PayrollRun;
  items: EmployeePayroll[];
  meta: IMeta;
  search: string;
}

const tryDate = (value?: string | null) => {
  if (!value) return null;
  try {
    return format(parseISO(value), "MMM d, yyyy h:mm a");
  } catch {
    return value;
  }
};

const PayrollRunDetailView = ({
  run,
  items,
  meta,
  search: initialSearch,
}: PayrollRunDetailViewProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchDraft, setSearchDraft] = useState(initialSearch);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [approving, setApproving] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const locked = isRunLocked(run.status);
  const canApprove = run.status === "generated";
  const canRegenerate = run.status === "draft" || run.status === "generated";

  const applySearch = (nextSearch: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSearch) {
      params.set("search", nextSearch);
    } else {
      params.delete("search");
    }
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleApprove = async () => {
    setApproving(true);
    const response = await approvePayrollRun(run.id, {
      notes: approveNotes.trim() ? approveNotes.trim() : undefined,
    });
    if (response?.success) {
      toast.success(response.message ?? "Payroll run approved.");
      setApproveOpen(false);
      setApproveNotes("");
      router.refresh();
    } else {
      toast.error(response?.message ?? "Failed to approve the run.");
    }
    setApproving(false);
  };

  const handleExport = async () => {
    setExporting(true);
    await downloadPayrollExport(run.id);
    setExporting(false);
  };

  const skipped = run.failed_count;
  const showSkippedBanner = skipped > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="pl-0">
            <Link href="/payroll/runs">
              <ChevronLeft className="size-4" />
              Back to runs
            </Link>
          </Button>
          <HeadingComponent
            heading={`${formatPayrollPeriod(run.month, run.year)} payroll`}
            subHeading={`Payroll run #${run.id} · ${run.currency}`}
          />
        </div>
        <PayrollSubNav canManage />
      </div>

      <div className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <PayrollRunStatusBadge status={run.status} />
            <div className="flex items-center gap-2 text-sm text-subTextColor dark:text-darkTextSecondary">
              <CalendarDays className="size-4" />
              {tryDate(run.period_start)} → {tryDate(run.period_end)}
            </div>
            {run.approved_at ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                <BadgeCheck className="size-4" />
                Approved {tryDate(run.approved_at)}
                {run.approvedBy ? ` by ${run.approvedBy.name}` : ""}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {canApprove && (
              <Button onClick={() => setApproveOpen(true)}>
                <BadgeCheck className="size-4" />
                Approve
              </Button>
            )}
            {canRegenerate && (
              <Button asChild variant="outline2">
                <Link
                  href={{
                    pathname: "/payroll/generate",
                    query: { month: run.month, year: run.year },
                  }}
                >
                  <RefreshCcw className="size-4" />
                  Regenerate
                </Link>
              </Button>
            )}
            <Button variant="outline2" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileDown className="size-4" />
              )}
              Export CSV
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat
            label="Total Employees"
            value={String(run.total_employees)}
            helper={`${run.generated_count} generated · ${run.failed_count} failed`}
            accent="#2563eb"
          />
          <SummaryStat
            label="Total Gross"
            value={formatPayrollMoney(run.total_gross, run.currency)}
            helper="Before deductions and overtime"
            accent="#7c3aed"
          />
          <SummaryStat
            label="Total Net"
            value={formatPayrollMoney(run.total_net, run.currency)}
            helper="Amount payable to employees"
            accent="#059669"
          />
          <SummaryStat
            label="Currency"
            value={run.currency}
            helper="Applies to all items in this run"
            accent="#f59e0b"
            icon={<Coins className="size-4" />}
          />
        </div>

        {run.notes ? (
          <div className="mt-5 rounded-[8px] border border-borderColor bg-bgSecondary/50 p-4 text-sm text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
            <p className="mb-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
              Notes
            </p>
            {run.notes}
          </div>
        ) : null}
      </div>

      {showSkippedBanner ? (
        <div className="flex items-start gap-3 rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle className="mt-0.5 size-4 text-amber-600 dark:text-amber-300" />
          <div className="text-amber-800 dark:text-amber-200">
            <p className="font-medium">
              {skipped} employee{skipped === 1 ? "" : "s"} skipped due to missing payroll profiles.
            </p>
            <p className="mt-1 text-xs">
              Configure their profiles from the payroll settings page and regenerate this run.
            </p>
            <Button asChild variant="ghost" size="sm" className="mt-2 h-auto px-0 text-amber-800 dark:text-amber-200">
              <Link href="/payroll/settings">Configure now →</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-[12px] border border-borderColor dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="flex flex-col gap-3 border-b border-borderColor p-4 sm:flex-row sm:items-center sm:justify-between dark:border-darkBorder">
          <div>
            <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Employee payslips
            </p>
            <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
              {meta.total} rows total · page {meta.page} of {meta.totalPages || 1}
            </p>
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              applySearch(searchDraft.trim());
            }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search by name or email"
                className="w-full min-w-[240px] pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg"
              />
            </div>
            <Button type="submit" size="sm">
              Search
            </Button>
            {initialSearch ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchDraft("");
                  applySearch("");
                }}
              >
                Clear
              </Button>
            ) : null}
          </form>
        </div>

        {items.length === 0 ? (
          <PayrollEmptyState
            text={
              initialSearch
                ? `No employee matched "${initialSearch}".`
                : "No employees on this payroll run."
            }
          />
        ) : (
          <div className="overflow-x-auto pb-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Worked</TableHead>
                  <TableHead>Leave</TableHead>
                  <TableHead>Holiday</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Payable</TableHead>
                  <TableHead>Basic</TableHead>
                  <TableHead>OT amount</TableHead>
                  <TableHead>Deduction</TableHead>
                  <TableHead className="text-right">Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isExpanded = expandedRow === item.id;
                  return (
                    <Fragment key={item.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() =>
                          setExpandedRow(isExpanded ? null : item.id)
                        }
                      >
                        <TableCell>
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                              {item.user?.name ?? `User #${item.user_id}`}
                            </p>
                            <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                              {item.user?.email ?? ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <SalaryTypeBadge type={item.salary_type} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatPayrollHours(item.target_hours)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatPayrollHours(item.worked_hours)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatPayrollHours(item.leave_hours)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatPayrollHours(item.holiday_hours)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatPayrollHours(item.overtime_hours)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatPayrollHours(item.payable_hours)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatPayrollMoney(item.basic_salary, item.currency)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatPayrollMoney(item.overtime_amount, item.currency)}
                        </TableCell>
                        <TableCell className="text-sm text-red-600">
                          {item.deduction_amount > 0 ? "-" : ""}
                          {formatPayrollMoney(item.deduction_amount, item.currency)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          {formatPayrollMoney(item.final_salary, item.currency)}
                        </TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow>
                          <TableCell colSpan={13} className="bg-bgSecondary/50 dark:bg-darkPrimaryBg">
                            <div className="p-4">
                              <p className="mb-3 text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                Calculation snapshot
                              </p>
                              <pre className="max-h-[280px] overflow-auto rounded-[8px] border border-borderColor bg-white p-3 text-xs text-subTextColor dark:border-darkBorder dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
                                {JSON.stringify(item.calculation_snapshot, null, 2)}
                              </pre>
                              {item.notes ? (
                                <p className="mt-3 rounded-[8px] border border-borderColor bg-white p-3 text-xs text-subTextColor dark:border-darkBorder dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
                                  <span className="font-semibold">Notes: </span>
                                  {item.notes}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {meta.total > meta.limit && (
        <AppPagination
          total={meta.total}
          currentPage={meta.page}
          limit={meta.limit}
        />
      )}

      <Dialog
        open={approveOpen}
        onOpenChange={(open) => {
          if (!approving) setApproveOpen(open);
        }}
      >
        <DialogContent className="dark:bg-darkSecondaryBg">
          <DialogHeader>
            <DialogTitle>Approve payroll run?</DialogTitle>
            <DialogDescription>
              Approving locks all salaries for this period. Historical amounts
              cannot be edited afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
              Notes (optional)
            </label>
            <Textarea
              rows={4}
              placeholder="e.g. Reviewed and approved by finance"
              value={approveNotes}
              onChange={(event) => setApproveNotes(event.target.value)}
              disabled={approving}
              className="dark:border-darkBorder dark:bg-darkPrimaryBg"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline2"
              onClick={() => setApproveOpen(false)}
              disabled={approving}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approving || locked}>
              {approving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Approving
                </>
              ) : (
                <>
                  <BadgeCheck className="size-4" />
                  Yes, approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface SummaryStatProps {
  label: string;
  value: string;
  helper: string;
  accent: string;
  icon?: React.ReactNode;
}

const SummaryStat = ({ label, value, helper, accent, icon }: SummaryStatProps) => (
  <div className="rounded-[12px] border border-borderColor p-4 dark:border-darkBorder">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
        {label}
      </p>
      {icon ? (
        <div
          className="rounded-2xl p-2"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          {icon}
        </div>
      ) : null}
    </div>
    <p className="text-2xl font-semibold" style={{ color: accent }}>
      {value}
    </p>
    <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary">
      {helper}
    </p>
  </div>
);

export default PayrollRunDetailView;
