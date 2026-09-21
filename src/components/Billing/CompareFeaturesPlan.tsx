import React from "react";
import { Check, Minus } from "lucide-react";

// Reusable component to render cell values cleanly
const RenderCell = ({
  value,
}: {
  value: boolean | string | null | undefined;
}) => {
  if (value === true) {
    return <Check className="w-5 h-5 text-blue-500 mx-auto stroke-[2.5]" />;
  }
  if (value === false || value === null || value === undefined) {
    return <Minus className="w-4 h-4 text-gray-300 mx-auto" />;
  }
  return (
    <span className="font-semibold text-gray-800 dark:text-darkTextSecondary text-sm">
      {value}
    </span>
  );
};

interface TableRow {
  isCategory?: boolean;
  feature?: string;
  starter?: boolean | string | null;
  pro?: boolean | string | null;
  enterprise?: boolean | string | null;
}

const tableData: TableRow[] = [
  // Core Features
  { feature: "Time Tracking", starter: true, pro: true, enterprise: true },
  {
    feature: "Screenshot Monitoring",
    starter: "1 screenshot/hour",
    pro: "20 screenshots/hour",
    enterprise: true,
  },
  {
    feature: "Apps Usage Tracking",
    starter: "Up to 5 apps / user / day",
    pro: true,
    enterprise: true,
  },
  {
    feature: "URLs Tracking",
    starter: "Up to 5 URLs / user / day",
    pro: true,
    enterprise: true,
  },
  {
    feature: "Activity Analytics",
    starter: "Up to 14 days history",
    pro: true,
    enterprise: true,
  },
  {
    feature: "Timesheets",
    starter: "Up to 1 month history",
    pro: true,
    enterprise: true,
  },
  {
    feature: "Projects",
    starter: "Up to 3 projects",
    pro: true,
    enterprise: true,
  },
  {
    feature: "Timesheet Approval",
    starter: true,
    pro: false,
    enterprise: false,
  },
  { feature: "Dashboard", starter: true, pro: true, enterprise: true },
  { feature: "Unlimited Tasks", starter: true, pro: true, enterprise: true },
  {
    feature: "Team Manager & Admin",
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Attendance & Leaves",
    starter: false,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Real Time Active View",
    starter: false,
    pro: true,
    enterprise: true,
  },
  { feature: "Integrations", starter: false, pro: true, enterprise: true },
  {
    feature: "Payroll and Members",
    starter: false,
    pro: true,
    enterprise: true,
  },
  { feature: "All from Pro", starter: false, pro: false, enterprise: true },
  {
    feature: "More screenshots",
    starter: false,
    pro: false,
    enterprise: "60 screenshots/hour",
  },
  {
    feature: "AI report analysis (coming soon)",
    starter: false,
    pro: false,
    enterprise: true,
  },
  {
    feature: "AI chatbot (coming soon)",
    starter: false,
    pro: false,
    enterprise: true,
  },

  // Plan Limits Category Section
  { isCategory: true, feature: "PLAN LIMITS" },
  {
    feature: "Max seats",
    starter: "10",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Max projects",
    starter: "3",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Timesheet retention days",
    starter: "30",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Apps tracking daily limit",
    starter: "5",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Urls tracking daily limit",
    starter: "5",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Screenshot interval in minute",
    starter: "Every 60 min",
    pro: "Every 3 min",
    enterprise: "Every 1 min",
  },
  {
    feature: "Attendance leaves retention days",
    starter: "30",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Activity analytics retention days",
    starter: "14",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
];

export default function CompareFeaturesPlan({ margin }: { margin: string }) {
  return (
    <div className={margin}>
      <div className="overflow-x-auto border border-borderColor/50 dark:border-borderColor/20 rounded-xl bg-white dark:bg-darkPrimaryBg">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="text-sm font-semibold">
              <th className="p-4 w-1/4 bg-[#e6f3fe] dark:bg-[#1e2939a9] text-headingTextColor dark:text-darkTextPrimary rounded-tl-xl">
                Feature
              </th>

              <th className="p-4 w-1/4 bg-[#e6f3fe] dark:bg-[#1e2939a9] text-center text-headingTextColor dark:text-darkTextPrimary font-bold">
                Starter
              </th>

              <th className="p-4 w-1/4 bg-black text-center text-white">Pro</th>

              <th className="p-4 w-1/4 bg-[#0772ca] text-center text-white rounded-tr-xl">
                Enterprise
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-darkBorder text-sm">
            {tableData.map((row, index) => {
              if (row.isCategory) {
                return (
                  <tr key={index} className="bg-gray-50 dark:bg-gray-800">
                    <td
                      colSpan={4}
                      className="p-4 font-bold text-xs uppercase tracking-wider text-headingTextColor dark:text-darkTextPrimary"
                    >
                      {row.feature}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={index}>
                  <td className="p-4 text-headingTextColor dark:text-darkTextSecondary">
                    {row.feature}
                  </td>

                  <td className="p-4 text-center">
                    <RenderCell value={row.starter} />
                  </td>

                  <td className="p-4 text-center">
                    <RenderCell value={row.pro} />
                  </td>

                  <td className="p-4 text-center">
                    <RenderCell value={row.enterprise} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
