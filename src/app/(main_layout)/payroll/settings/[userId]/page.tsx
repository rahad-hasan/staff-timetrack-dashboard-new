import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ChevronLeft, Clock, User } from "lucide-react";

import { getPayrollProfileForUser } from "@/actions/payroll/action";
import HeadingComponent from "@/components/Common/HeadingComponent";
import PayrollAccessDenied from "@/components/Payroll/PayrollAccessDenied";
import {
  ProfileActiveBadge,
  SalaryTypeBadge,
} from "@/components/Payroll/PayrollBadges";
import { Button } from "@/components/ui/button";
import { canManagePayroll, formatPayrollMoney } from "@/lib/payroll";
import { getDecodedUser } from "@/utils/decodedLogInUser";

export const metadata: Metadata = {
  title: "Payroll Profile History",
  description: "Historical salary profiles for an employee.",
};

const tryDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
};

interface PageProps {
  params: Promise<{ userId: string }>;
}

const PayrollProfileHistoryPage = async ({ params }: PageProps) => {
  const { userId } = await params;
  const parsedUserId = Number(userId);

  if (!parsedUserId || Number.isNaN(parsedUserId)) {
    notFound();
  }

  const currentUser = await getDecodedUser();
  if (!canManagePayroll(currentUser?.role)) {
    return <PayrollAccessDenied />;
  }

  const response = await getPayrollProfileForUser(parsedUserId);
  const profiles = response?.success && Array.isArray(response.data)
    ? response.data
    : [];

  const employeeName = profiles[0]?.user?.name ?? `User #${parsedUserId}`;
  const employeeEmail = profiles[0]?.user?.email ?? "";

  return (
    <div>
      <div className="mb-5">
        <div className="mb-3">
          <Button asChild variant="ghost" size="sm" className="pl-0">
            <Link href="/payroll/settings">
              <ChevronLeft className="size-4" />
              Back to payroll settings
            </Link>
          </Button>
        </div>
        <HeadingComponent
          heading={`Payroll history — ${employeeName}`}
          subHeading={
            employeeEmail
              ? `Every salary profile that ever applied to ${employeeEmail}.`
              : "Every salary profile that ever applied to this employee."
          }
        />
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-[12px] border border-borderColor bg-white p-10 text-center dark:border-darkBorder dark:bg-darkSecondaryBg">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-6" />
          </div>
          <p className="mt-4 text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
            No payroll profiles yet
          </p>
          <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
            {response?.message || "This employee does not have any payroll profiles."}
          </p>
        </div>
      ) : (
        <ol className="relative space-y-4 border-l border-borderColor pl-6 dark:border-darkBorder">
          {profiles.map((profile) => (
            <li key={profile.id} className="relative">
              <span className="absolute -left-[36px] -top-2 flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="size-3.5" />
              </span>
              <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
                      Effective
                    </p>
                    <p className="font-semibold text-headingTextColor dark:text-darkTextPrimary">
                      {tryDate(profile.effective_from)} → {tryDate(profile.effective_to)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <SalaryTypeBadge type={profile.salary_type} />
                    <ProfileActiveBadge isActive={profile.is_active} />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
                      Base rate
                    </p>
                    <p className="mt-1 text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                      {profile.salary_type === "monthly_fixed"
                        ? `${formatPayrollMoney(profile.monthly_salary, profile.currency)} / mo`
                        : `${formatPayrollMoney(profile.hourly_rate, profile.currency)} / hr`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
                      Overtime
                    </p>
                    <p className="mt-1 text-sm text-headingTextColor dark:text-darkTextPrimary">
                      {profile.overtime_allow
                        ? `${profile.overtime_multiplier}× allowed`
                        : "Disabled"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
                      Deduction
                    </p>
                    <p className="mt-1 text-sm text-headingTextColor dark:text-darkTextPrimary">
                      {profile.salary_type === "monthly_fixed"
                        ? profile.is_deduct_salary
                          ? "On short hours"
                          : "None"
                        : "N/A (hourly)"}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default PayrollProfileHistoryPage;
