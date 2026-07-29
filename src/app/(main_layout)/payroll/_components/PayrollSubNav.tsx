"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface PayrollSubNavProps {
  canManage: boolean;
}

const managerItems = [
  {
    href: "/payroll/settings",
    title: "Payroll Settings",
    description: "Employee salary profiles and history",
  },
  {
    href: "/payroll/generate",
    title: "Generate Payroll",
    description: "Run monthly payroll calculation",
  },
  {
    href: "/payroll/runs",
    title: "Payroll Runs",
    description: "Review, approve, and export runs",
  },
  {
    href: "/payroll/my-payslips",
    title: "My Payslips",
    description: "Your personal salary history",
  },
] as const;

const employeeItems = [
  {
    href: "/payroll/my-payslips",
    title: "My Payslips",
    description: "Your personal salary history",
  },
] as const;

const PayrollSubNav = ({ canManage }: PayrollSubNavProps) => {
  const pathname = usePathname();
  const items = canManage ? managerItems : employeeItems;

  if (items.length <= 1) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "min-w-[220px] rounded-[12px] border px-4 py-3 transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-headingTextColor dark:border-primary/40 dark:bg-primary/15 dark:text-darkTextPrimary"
                : "border-borderColor bg-white text-headingTextColor hover:border-primary/30 hover:bg-primary/5 dark:border-darkBorder dark:bg-darkSecondaryBg dark:text-darkTextPrimary",
            )}
          >
            <p className="text-sm font-semibold dark:text-darkTextPrimary">
              {item.title}
            </p>
            <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary">
              {item.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
};

export default PayrollSubNav;
