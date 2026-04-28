"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/leave-management/leave-types",
    title: "Leave Types",
    description: "Policy rules and allocation setup",
  },
  {
    href: "/leave-management/holidays",
    title: "Holidays",
    description: "Manual entries and import management",
  },
] as const;

const LeaveTypeSubNav = () => {
  const pathname = usePathname();

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

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
            <p className="text-sm font-semibold dark:text-darkTextPrimary">{item.title}</p>
            <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary">
              {item.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
};

export default LeaveTypeSubNav;
