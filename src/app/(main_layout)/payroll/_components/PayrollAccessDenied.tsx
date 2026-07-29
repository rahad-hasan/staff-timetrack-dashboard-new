import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PayrollAccessDeniedProps {
  message?: string;
}

const PayrollAccessDenied = ({ message }: PayrollAccessDeniedProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-[12px] border border-borderColor bg-white px-6 py-16 text-center dark:border-darkBorder dark:bg-darkSecondaryBg">
      <div className="rounded-full bg-amber-100 p-4 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
        <ShieldAlert className="size-8" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
        Payroll access restricted
      </h2>
      <p className="mt-2 max-w-md text-sm text-subTextColor dark:text-darkTextSecondary">
        {message ??
          "Only admin and HR users can access this section. If you need access, please contact your administrator."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline2">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <Button asChild>
          <Link href="/payroll/my-payslips">View my payslips</Link>
        </Button>
      </div>
    </div>
  );
};

export default PayrollAccessDenied;
